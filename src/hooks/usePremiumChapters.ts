import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ChapterUnlock, PremiumChapter } from '@/types/monetization';
import { useCoins } from './useCoins';

export function usePremiumChapters() {
  const { user } = useAuth();
  const { spendCoins } = useCoins();
  const [unlockedChapters, setUnlockedChapters] = useState<ChapterUnlock[]>([]);
  const [premiumChapters, setPremiumChapters] = useState<PremiumChapter[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUnlockedChapters = useCallback(async () => {
    if (!user) return;

    try {
      // Mock data for demonstration
      const mockUnlocks: ChapterUnlock[] = [
        {
          id: '1',
          user_id: user.id,
          chapter_id: 'chapter-10',
          unlocked_at: new Date().toISOString(),
          transaction_id: 'tx-1'
        }
      ];
      
      setUnlockedChapters(mockUnlocks);
    } catch (error) {
      console.error('Error fetching unlocked chapters:', error);
    }
  }, [user]);

  const fetchPremiumChapters = useCallback(async () => {
    try {
      // Mock premium chapters data
      const mockPremium: PremiumChapter[] = [
        {
          chapter_id: 'chapter-15',
          cost_in_coins: 50,
          unlock_type: 'permanent',
          early_access: true
        }
      ];
      
      setPremiumChapters(mockPremium);
    } catch (error) {
      console.error('Error fetching premium chapters:', error);
    }
  }, []);

  const unlockChapter = useCallback(async (
    chapterId: string, 
    costInCoins: number, 
    unlockType: 'permanent' | 'temporary',
    unlockDuration?: number
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to unlock chapters');
      return false;
    }

    try {
      setLoading(true);

      // Spend coins first
      const coinsSpent = await spendCoins(
        costInCoins, 
        `Unlocked chapter ${chapterId}`, 
        chapterId
      );

      if (!coinsSpent) return false;

      // Mock unlock logic
      const mockUnlock: ChapterUnlock = {
        id: `unlock-${Date.now()}`,
        user_id: user.id,
        chapter_id: chapterId,
        unlocked_at: new Date().toISOString(),
        transaction_id: `tx-${Date.now()}`
      };

      if (unlockType === 'temporary' && unlockDuration) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + unlockDuration);
        mockUnlock.expires_at = expiresAt.toISOString();
      }

      setUnlockedChapters(prev => [...prev, mockUnlock]);

      toast.success(
        unlockType === 'permanent' 
          ? 'Chapter unlocked permanently!' 
          : `Chapter unlocked for ${unlockDuration} hours!`
      );
      return true;
    } catch (error) {
      console.error('Error unlocking chapter:', error);
      toast.error('Failed to unlock chapter');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, spendCoins, fetchUnlockedChapters]);

  const isChapterUnlocked = useCallback((chapterId: string): boolean => {
    return unlockedChapters.some(unlock => 
      unlock.chapter_id === chapterId &&
      (!unlock.expires_at || new Date(unlock.expires_at) > new Date())
    );
  }, [unlockedChapters]);

  const getChapterCost = useCallback((chapterId: string): number | null => {
    const premiumChapter = premiumChapters.find(pc => pc.chapter_id === chapterId);
    return premiumChapter?.cost_in_coins || null;
  }, [premiumChapters]);

  const isChapterPremium = useCallback((chapterId: string): boolean => {
    return premiumChapters.some(pc => pc.chapter_id === chapterId);
  }, [premiumChapters]);

  useEffect(() => {
    if (user) {
      fetchUnlockedChapters();
    }
    fetchPremiumChapters();
  }, [user, fetchUnlockedChapters, fetchPremiumChapters]);

  return {
    unlockedChapters,
    premiumChapters,
    loading,
    unlockChapter,
    isChapterUnlocked,
    getChapterCost,
    isChapterPremium,
    refreshUnlocks: fetchUnlockedChapters
  };
}