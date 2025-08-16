import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Lock, Coins, Clock, Crown } from 'lucide-react';
import { useCoins } from '@/hooks/useCoins';
import { usePremiumChapters } from '@/hooks/usePremiumChapters';
import { cn } from '@/lib/utils';

interface PremiumChapterUnlockProps {
  chapterId: string;
  chapterTitle: string;
  costInCoins: number;
  unlockType: 'permanent' | 'temporary';
  unlockDuration?: number;
  earlyAccess?: boolean;
  onUnlockSuccess?: () => void;
}

export const PremiumChapterUnlock: React.FC<PremiumChapterUnlockProps> = ({
  chapterId,
  chapterTitle,
  costInCoins,
  unlockType,
  unlockDuration,
  earlyAccess = false,
  onUnlockSuccess
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { userCoins, spendCoins } = useCoins();
  const { unlockChapter, isChapterUnlocked, loading } = usePremiumChapters();

  const isUnlocked = isChapterUnlocked(chapterId);
  const canAfford = userCoins && userCoins.balance >= costInCoins;

  const handleUnlock = async () => {
    const success = await unlockChapter(chapterId, costInCoins, unlockType, unlockDuration);
    if (success) {
      onUnlockSuccess?.();
      setShowConfirmDialog(false);
    }
  };

  if (isUnlocked) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Chapter Unlocked
              </span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {unlockType === 'permanent' ? 'Permanent' : `${unlockDuration}h access`}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
              Premium Chapter
            </CardTitle>
            {earlyAccess && (
              <Badge variant="destructive" className="ml-auto">
                Early Access
              </Badge>
            )}
          </div>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            {chapterTitle}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600" />
              <span className="font-medium">{costInCoins} coins</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {unlockType === 'temporary' && unlockDuration && (
                <>
                  <Clock className="h-4 w-4" />
                  <span>{unlockDuration}h access</span>
                </>
              )}
              {unlockType === 'permanent' && (
                <>
                  <Crown className="h-4 w-4" />
                  <span>Permanent access</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              Your balance: {userCoins?.balance || 0} coins
            </div>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!canAfford || loading}
              className={cn(
                "min-w-[120px]",
                !canAfford && "opacity-50"
              )}
            >
              {!canAfford ? 'Insufficient Coins' : 'Unlock Chapter'}
            </Button>
          </div>

          {!canAfford && (
            <div className="text-sm text-red-600 dark:text-red-400">
              You need {costInCoins - (userCoins?.balance || 0)} more coins to unlock this chapter.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock Premium Chapter</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You're about to unlock "{chapterTitle}" for {costInCoins} coins.
              </p>
              <p>
                This will give you {unlockType === 'permanent' ? 'permanent' : `${unlockDuration} hour`} access to this chapter.
              </p>
              <p className="font-medium">
                Remaining balance after unlock: {(userCoins?.balance || 0) - costInCoins} coins
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlock} disabled={loading}>
              {loading ? 'Unlocking...' : 'Confirm Unlock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};