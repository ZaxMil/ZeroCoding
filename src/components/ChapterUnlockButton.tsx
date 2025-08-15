import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Coins, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { runtime } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { useCoinWallet } from '@/hooks/useCoinWallet';
import { getMockWallet, getUnlockedChapters, addUnlockedChapter } from '@/lib/mockStorage';
import { AsyncErrorBoundary } from '@/components/AsyncErrorBoundary';
import { logger } from '@/utils/logger';

interface ChapterPrice {
  coin_cost: number;
  premium_only: boolean;
  early_access_hours: number;
}

interface ChapterUnlockButtonProps {
  chapterId: string;
  chapterTitle?: string;
  className?: string;
  onUnlocked?: () => void;
}

const ChapterUnlockButtonComponent: React.FC<ChapterUnlockButtonProps> = ({
  chapterId,
  chapterTitle = "Chapter",
  className = "",
  onUnlocked
}) => {
  const [price, setPrice] = useState<ChapterPrice | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { wallet, spendCoins, refreshWallet } = useCoinWallet();

  const checkAccess = async () => {
    try {
      if (runtime.USE_MOCKS) {
        // Default mock price if not provided elsewhere
        const defaultPrice: ChapterPrice = { coin_cost: 10, premium_only: false, early_access_hours: 0 };
        setPrice(defaultPrice);
        if (user) {
          const unlocked = getUnlockedChapters(user.id);
          setHasAccess(!!unlocked[chapterId]);
          setUserBalance(wallet?.balance ?? getMockWallet(user.id).balance);
        } else {
          setHasAccess(false);
          setUserBalance(0);
        }
        setIsPremium(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return;
      }

      // Check chapter access
      const { data: accessData } = await supabase
        .rpc('user_has_chapter_access', { 
          chapter_id_param: chapterId,
          user_id_param: authUser.id 
        });

      setHasAccess(accessData || false);

      // Get chapter pricing
      const { data: priceData } = await supabase
        .from('chapter_prices')
        .select('coin_cost, premium_only, early_access_hours')
        .eq('chapter_id', chapterId)
        .single();

      setPrice(priceData);

      // Get user coin balance
      const { data: walletData } = await supabase
        .from('coin_wallets')
        .select('balance')
        .eq('user_id', authUser.id)
        .single();

      setUserBalance(walletData?.balance || 0);

      // Check premium status
      const { data: premiumData } = await supabase
        .rpc('is_premium_user', { user_id: authUser.id });

      setIsPremium(premiumData || false);

    } catch (error) {
      logger.error('Error checking chapter access:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!price || unlocking) return;

    setUnlocking(true);
    try {
      if (runtime.USE_MOCKS) {
        if (!user) throw new Error('Not authenticated');
        const ok = await spendCoins(price.coin_cost, `Unlock ${chapterTitle}`, chapterId);
        if (ok) {
          addUnlockedChapter(user.id, chapterId);
          setHasAccess(true);
          refreshWallet();
          setUserBalance((wallet?.balance || 0) - price.coin_cost);
          setShowConfirm(false);
          onUnlocked?.();
          toast({ title: 'Chapter Unlocked!', description: `You've unlocked ${chapterTitle} for ${price.coin_cost} coins.` });
        }
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      // Start transaction-like operations
      logger.info('Starting unlock process for chapter:', chapterId);

      // 1. Check if user has sufficient coins
      const { data: walletData, error: walletError } = await supabase
        .from('coin_wallets')
        .select('balance')
        .eq('user_id', authUser.id)
        .single();

      if (walletError) throw new Error('Failed to check wallet balance');
      
      const currentBalance = walletData?.balance || 0;
      if (currentBalance < price.coin_cost) {
        toast({ title: 'Insufficient Funds', description: 'You do not have enough coins.', variant: 'destructive' });
        return;
      }

      // 2. Check if chapter is already unlocked
      const { data: existingAccess } = await supabase
        .from('chapter_access')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('chapter_id', chapterId)
        .single();

      if (existingAccess) {
        toast({ title: 'Already Unlocked', description: 'You already have access to this chapter.', variant: 'destructive' });
        return;
      }

      // 3. Create coin transaction record
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: authUser.id,
          amount: -price.coin_cost,
          type: 'spend',
          context: `Unlocked ${chapterTitle}`,
          reference_id: chapterId,
          description: `Unlocked ${chapterTitle}`
        });

      if (transactionError) throw new Error('Failed to record transaction');

      // 4. Update wallet balance
      const newBalance = currentBalance - price.coin_cost;
      const { error: updateError } = await supabase
        .from('coin_wallets')
        .update({ balance: newBalance })
        .eq('user_id', authUser.id);

      if (updateError) throw new Error('Failed to update wallet balance');

      // 5. Grant chapter access
      const { error: accessError } = await supabase
        .from('chapter_access')
        .insert({
          user_id: authUser.id,
          chapter_id: chapterId,
          access_type: 'coins',
          coins_spent: price.coin_cost,
          granted_at: new Date().toISOString()
        });

      if (accessError) throw new Error('Failed to grant chapter access');

      logger.info('Successfully unlocked chapter:', chapterId);
      
      setHasAccess(true);
      setUserBalance(newBalance);
      setShowConfirm(false);
      window.dispatchEvent(new CustomEvent('chapter-unlocked', { detail: { chapterId } }));
      onUnlocked?.();
      toast({ title: 'Chapter Unlocked!', description: `You've unlocked ${chapterTitle} for ${price.coin_cost} coins.` });
    } catch (error: any) {
      logger.error('Chapter unlock error:', { error: error?.message, chapterId });
      toast({ title: 'Error', description: `Unlock failed: ${error?.message || 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setUnlocking(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [chapterId]);

  if (loading) {
    return (
      <Button disabled className={className}>
        <Lock className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // User has access
  if (hasAccess) {
    return (
      <Badge variant="secondary" className={className}>
        <Unlock className="h-4 w-4 mr-1" />
        Unlocked
      </Badge>
    );
  }

  // Chapter is free
  if (!price || price.coin_cost === 0) {
    return (
      <Badge variant="default" className={className}>
        <Unlock className="h-4 w-4 mr-1" />
        Free
      </Badge>
    );
  }

  // Premium only chapter
  if (price.premium_only && !isPremium) {
    return (
      <Badge variant="secondary" className={className}>
        <Crown className="h-4 w-4 mr-1" />
        Premium Only
      </Badge>
    );
  }

  // Premium user can access
  if (isPremium && !price.premium_only) {
    return (
      <Badge variant="default" className={className}>
        <Crown className="h-4 w-4 mr-1" />
        Premium Access
      </Badge>
    );
  }

  // Needs coins to unlock
  const canAfford = userBalance >= price.coin_cost;

  return (
    <>
      <Button
        variant={canAfford ? "default" : "outline"}
        className={className}
        onClick={() => setShowConfirm(true)}
        
      >
        <Coins className="h-4 w-4 mr-2" />
        {canAfford ? `Unlock (${price.coin_cost} coins)` : `Need ${price.coin_cost} coins`}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlock "{chapterTitle}" for {price.coin_cost} coins?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span>Current Balance:</span>
              <span className="font-semibold">{userBalance} coins</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span>Cost:</span>
              <span className="font-semibold text-red-600">-{price.coin_cost} coins</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span>Remaining Balance:</span>
              <span className="font-semibold">{userBalance - price.coin_cost} coins</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUnlock}
              disabled={unlocking}
            >
              {unlocking ? 'Unlocking...' : 'Confirm Unlock'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ChapterUnlockButton: React.FC<ChapterUnlockButtonProps> = (props) => (
  <AsyncErrorBoundary componentName="Chapter Unlock Button">
    <ChapterUnlockButtonComponent {...props} />
  </AsyncErrorBoundary>
);