import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from './useLocalStorage';

export interface ReadingProgress {
  chapterId: string;
  currentPage: number;
  totalPages: number;
  scrollPosition?: number; // For webtoon mode
  readingMode: 'webtoon' | 'single' | 'double';
  completed: boolean;
  percentage: number;
  lastReadAt: string;
  resumePosition?: {
    page: number;
    scroll: number;
  };
}

export interface ProgressSyncOptions {
  enableTracking: boolean;
  syncAcrossDevices: boolean;
  saveScrollPosition: boolean;
  autoResume: boolean;
}

export const useAdvancedReadingProgress = (userId?: string, chapterId?: string) => {
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Guest storage for non-authenticated users
  const [guestProgress, setGuestProgress] = useLocalStorage<Record<string, ReadingProgress>>(
    'guest-reading-progress', 
    {}
  );
  
  // Settings for progress tracking
  const [settings] = useLocalStorage<ProgressSyncOptions>('progress-settings', {
    enableTracking: true,
    syncAcrossDevices: true,
    saveScrollPosition: true,
    autoResume: true
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced progress save to prevent excessive API calls
  const debouncedSave = useCallback((
    chapterId: string, 
    progressData: Partial<ReadingProgress>
  ) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      updateProgress(chapterId, progressData);
    }, 1000); // Save after 1 second of inactivity
  }, []);

  // Fetch progress from Supabase for authenticated users
  const fetchServerProgress = useCallback(async () => {
    if (!userId || !settings.enableTracking) return {};

    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_read_at', { ascending: false });

      if (error) {
        console.error('Error fetching reading progress:', error);
        return {};
      }

      const progressMap: Record<string, ReadingProgress> = {};
      data?.forEach(item => {
        progressMap[item.chapter_id] = {
          chapterId: item.chapter_id,
          currentPage: item.current_page,
          totalPages: item.total_pages,
          scrollPosition: (item as any).scroll_position || 0,
          readingMode: (item as any).reading_mode || 'webtoon',
          completed: item.completed,
          percentage: item.completed ? 100 : Math.round((item.current_page / item.total_pages) * 100),
          lastReadAt: item.last_read_at,
          resumePosition: {
            page: item.current_page,
            scroll: (item as any).scroll_position || 0
          }
        };
      });

      return progressMap;
    } catch (err) {
      console.error('Error fetching server progress:', err);
      return {};
    }
  }, [userId, settings.enableTracking]);

  // Sync guest progress to server when user logs in
  const syncGuestToServer = useCallback(async () => {
    if (!userId || Object.keys(guestProgress).length === 0) return;

    try {
      const progressEntries = Object.entries(guestProgress).map(([chapterId, progress]) => ({
        user_id: userId,
        chapter_id: chapterId,
        current_page: progress.currentPage,
        total_pages: progress.totalPages,
        scroll_position: progress.scrollPosition || 0,
        reading_mode: progress.readingMode,
        completed: progress.completed,
        last_read_at: progress.lastReadAt,
      }));

      const { error } = await supabase
        .from('reading_progress')
        .upsert(progressEntries, { 
          onConflict: 'user_id,chapter_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error syncing guest progress:', error);
        return;
      }

      // Clear guest progress after successful sync
      setGuestProgress({});
      console.log('Successfully synced guest progress to server');
    } catch (err) {
      console.error('Error during progress sync:', err);
    }
  }, [userId, guestProgress, setGuestProgress]);

  // Load progress on component mount and user change
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      
      if (userId) {
        // Sync guest progress first
        await syncGuestToServer();
        
        // Load server progress
        const serverProgress = await fetchServerProgress();
        setProgress(serverProgress);
        setLastSyncTime(new Date());
      } else {
        // Use guest progress
        setProgress(guestProgress);
      }
      
      setIsLoading(false);
    };

    loadProgress();
  }, [userId, fetchServerProgress, syncGuestToServer, guestProgress]);

  // Update progress (local and remote)
  const updateProgress = useCallback(async (
    chapterId: string, 
    progressData: Partial<ReadingProgress>
  ) => {
    if (!settings.enableTracking) return;

    const currentProgress = progress[chapterId] || {
      chapterId,
      currentPage: 0,
      totalPages: 1,
      scrollPosition: 0,
      readingMode: 'webtoon' as const,
      completed: false,
      percentage: 0,
      lastReadAt: new Date().toISOString()
    };

    const updatedProgress: ReadingProgress = {
      ...currentProgress,
      ...progressData,
      lastReadAt: new Date().toISOString(),
      percentage: progressData.completed ? 100 : 
        Math.round(((progressData.currentPage || currentProgress.currentPage) / 
                   (progressData.totalPages || currentProgress.totalPages)) * 100),
      resumePosition: {
        page: progressData.currentPage || currentProgress.currentPage,
        scroll: progressData.scrollPosition || currentProgress.scrollPosition || 0
      }
    };

    // Update local state immediately
    setProgress(prev => ({ ...prev, [chapterId]: updatedProgress }));

    if (userId) {
      // Save to server
      try {
        const { error } = await supabase
          .from('reading_progress')
          .upsert({
            user_id: userId,
            chapter_id: chapterId,
            current_page: updatedProgress.currentPage,
            total_pages: updatedProgress.totalPages,
            scroll_position: settings.saveScrollPosition ? updatedProgress.scrollPosition : 0,
            reading_mode: updatedProgress.readingMode,
            completed: updatedProgress.completed,
            last_read_at: updatedProgress.lastReadAt,
          });

        if (error) {
          console.error('Error updating server progress:', error);
        }
      } catch (err) {
        console.error('Error saving progress to server:', err);
      }
    } else {
      // Save to guest storage
      const newGuestProgress = { ...guestProgress, [chapterId]: updatedProgress };
      setGuestProgress(newGuestProgress);
    }
  }, [userId, progress, settings, guestProgress, setGuestProgress]);

  // Get progress for specific chapter
  const getChapterProgress = useCallback((chapterId: string): ReadingProgress | null => {
    return progress[chapterId] || null;
  }, [progress]);

  // Get completion status
  const getCompletionStatus = useCallback((chapterId: string): 'unread' | 'reading' | 'completed' => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress) return 'unread';
    if (chapterProgress.completed) return 'completed';
    if (chapterProgress.currentPage > 0) return 'reading';
    return 'unread';
  }, [progress]);

  // Mark chapter as completed
  const markCompleted = useCallback((chapterId: string, totalPages: number) => {
    updateProgress(chapterId, {
      currentPage: totalPages - 1,
      totalPages,
      completed: true,
      percentage: 100
    });
  }, [updateProgress]);

  // Get recent reading activity
  const getRecentActivity = useCallback((limit: number = 10) => {
    return Object.values(progress)
      .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
      .slice(0, limit);
  }, [progress]);

  // Get reading statistics
  const getStats = useCallback(() => {
    const allProgress = Object.values(progress);
    const completed = allProgress.filter(p => p.completed).length;
    const reading = allProgress.filter(p => !p.completed && p.currentPage > 0).length;
    const totalChapters = allProgress.length;
    
    return {
      totalChapters,
      completed,
      reading,
      unread: totalChapters - completed - reading,
      averageCompletion: totalChapters > 0 ? 
        (allProgress.reduce((sum, p) => sum + p.percentage, 0) / totalChapters) : 0
    };
  }, [progress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    progress,
    isLoading,
    lastSyncTime,
    settings,
    
    // Actions
    updateProgress,
    debouncedSave,
    markCompleted,
    
    // Getters
    getChapterProgress,
    getCompletionStatus,
    getRecentActivity,
    getStats,
    
    // Utils
    syncGuestToServer,
    fetchServerProgress
  };
};