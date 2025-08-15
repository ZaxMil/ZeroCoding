import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Lock, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoinWallet } from '@/hooks/useCoinWallet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { runtime } from '@/config/runtime';
import { addUnlockedChapter } from '@/lib/mockStorage';
import CoinStorePopup from './CoinStorePopup';
import { AsyncErrorBoundary } from '@/components/AsyncErrorBoundary';
import { logger } from '@/utils/logger';

interface ChapterUnlockPopupProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
  unlockCost: number;
  onUnlocked?: () => void;
}

const ChapterUnlockPopupComponent: React.FC<ChapterUnlockPopupProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  unlockCost,
  onUnlocked
}) => {
  const { user } = useAuth();
  const { wallet, refreshWallet, spendCoins } = useCoinWallet();
  const { toast } = useToast();
  const [unlocking, setUnlocking] = useState(false);
  const [showCoinStore, setShowCoinStore] = useState(false);

  const canAfford = wallet && wallet.balance >= unlockCost;

  const handleUnlock = async () => {
    if (!user) return;

    setUnlocking(true);
    try {
      if (runtime.USE_MOCKS) {
        const ok = await spendCoins(unlockCost, `Unlock ${chapterTitle}`, chapterId);
        if (ok) {
          addUnlockedChapter(user.id, chapterId);
          onUnlocked?.();
          onClose();
          toast({ title: 'Chapter Unlocked!', description: `You've successfully unlocked ${chapterTitle}` });
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
      if (currentBalance < unlockCost) {
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
          amount: -unlockCost,
          type: 'spend',
          context: `Unlocked ${chapterTitle}`,
          reference_id: chapterId,
          description: `Unlocked ${chapterTitle}`
        });

      if (transactionError) throw new Error('Failed to record transaction');

      // 4. Update wallet balance
      const { error: updateError } = await supabase
        .from('coin_wallets')
        .update({ balance: currentBalance - unlockCost })
        .eq('user_id', authUser.id);

      if (updateError) throw new Error('Failed to update wallet balance');

      const { error: accessError } = await supabase
        .from('chapter_access')
        .insert({
          user_id: authUser.id,
          chapter_id: chapterId,
          access_type: 'coins',
          coins_spent: unlockCost,
          granted_at: new Date().toISOString()
        });

      if (accessError) throw new Error('Failed to grant chapter access');

      logger.info('Successfully unlocked chapter:', chapterId);
      
      onUnlocked?.();
      onClose();
      window.dispatchEvent(new CustomEvent('chapter-unlocked', { detail: { chapterId } }));
      refreshWallet();
      toast({ title: 'Chapter Unlocked!', description: `You've successfully unlocked ${chapterTitle}` });
    } catch (error: any) {
      logger.error('Chapter unlock error:', { error: error?.message, chapterId });
      toast({ title: 'Unlock Failed', description: `Unlock failed: ${error?.message || 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setUnlocking(false);
    }
  };

  const handleBuyCoins = () => {
    setShowCoinStore(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Unlock Chapter
            </DialogTitle>
            <DialogDescription>
              This chapter requires coins to unlock
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Chapter Info */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{chapterTitle}</h3>
              <Badge variant="outline" className="gap-1">
                <Coins className="h-3 w-3" />
                {unlockCost} coins
              </Badge>
            </div>

            {/* User Balance */}
            {user && (
              <div className="flex items-center justify-between p-4 bg-background border rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Your Balance:</span>
                </div>
                <span className={`font-bold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                  {wallet?.balance || 0} coins
                </span>
              </div>
            )}

            {/* Insufficient Funds Warning */}
            {!canAfford && user && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">
                  You need {unlockCost - (wallet?.balance || 0)} more coins
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {user ? (
                <>
                    <Button 
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="w-full"
                      size="lg"
                    >
                      {unlocking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Coins className="h-4 w-4 mr-2" />
                          Unlock for {unlockCost} coins
                        </>
                      )}
                    </Button>
                    {!canAfford && (
                      <Button 
                        onClick={handleBuyCoins}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy More Coins
                      </Button>
                    )}
                  
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Please sign in to unlock chapters
                  </p>
                  <Button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'signup' } }))}
                    className="w-full"
                    size="lg"
                  >
                    Sign in to unlock
                  </Button>
                  <Button onClick={onClose} variant="outline" className="w-full">
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CoinStorePopup 
        isOpen={showCoinStore} 
        onClose={() => {
          setShowCoinStore(false);
          refreshWallet();
        }} 
      />
    </>
  );
};

const ChapterUnlockPopup: React.FC<ChapterUnlockPopupProps> = (props) => (
  <AsyncErrorBoundary componentName="Chapter Unlock Popup">
    <ChapterUnlockPopupComponent {...props} />
  </AsyncErrorBoundary>
);

export default ChapterUnlockPopup;