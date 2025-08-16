import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ReadingProgress {
  chapterId: string;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  lastReadAt: string;
}

export const useReadingProgress = (chapterId: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load reading progress
  useEffect(() => {
    if (!user || !chapterId) return;

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('chapter_id', chapterId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setProgress({
            chapterId: data.chapter_id,
            currentPage: data.current_page,
            totalPages: data.total_pages,
            progressPercentage: data.progress_percentage,
            lastReadAt: data.last_read_at
          });
        }
      } catch (error) {
        console.error('Failed to load reading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user, chapterId]);

  // Update reading progress
  const updateProgress = useCallback(async (currentPage: number, totalPages: number) => {
    if (!user || !chapterId) return;

    const progressPercentage = Math.round((currentPage / totalPages) * 100);
    const newProgress: ReadingProgress = {
      chapterId,
      currentPage,
      totalPages,
      progressPercentage,
      lastReadAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          current_page: currentPage,
          total_pages: totalPages,
          progress_percentage: progressPercentage,
          last_read_at: newProgress.lastReadAt
        });

      if (error) throw error;
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to update reading progress:', error);
    }
  }, [user, chapterId]);

  return {
    progress,
    isLoading,
    updateProgress
  };
};