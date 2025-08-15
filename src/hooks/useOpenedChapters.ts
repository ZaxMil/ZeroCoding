import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OpenedChapter {
  chapterId: string;
  seriesId?: string;
  timestamp: number;
}

interface OpenedChapters {
  [chapterId: string]: {
    opened: boolean;
    seriesId?: string;
    timestamp: number;
  };
}

export const useOpenedChapters = () => {
  const { user } = useAuth();
  const [openedChapters, setOpenedChapters] = useState<OpenedChapters>({});
  const [loading, setLoading] = useState(true);

  // Load opened chapters from localStorage for guests or Supabase for authenticated users
  const loadOpenedChapters = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Load from Supabase reading_progress for authenticated users
        const { data, error } = await supabase
          .from('reading_progress')
          .select('chapter_id, created_at, chapters!inner(series_id)')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading opened chapters:', error);
          return;
        }

        const openedMap: OpenedChapters = {};
        data?.forEach(progress => {
          openedMap[progress.chapter_id] = {
            opened: true,
            seriesId: (progress as any).chapters?.series_id,
            timestamp: new Date(progress.created_at).getTime()
          };
        });

        setOpenedChapters(openedMap);
      } else {
        // Load from localStorage for guests
        try {
          const stored = localStorage.getItem('opened_chapters');
          if (stored) {
            const parsed: OpenedChapter[] = JSON.parse(stored);
            const openedMap: OpenedChapters = {};
            parsed.forEach(item => {
              openedMap[item.chapterId] = {
                opened: true,
                seriesId: item.seriesId,
                timestamp: item.timestamp
              };
            });
            setOpenedChapters(openedMap);
          }
        } catch (e) {
          console.error('Error parsing localStorage opened chapters:', e);
        }
      }
    } catch (error) {
      console.error('Error loading opened chapters:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark a chapter as opened
  const markChapterOpened = useCallback(async (chapterId: string, seriesId?: string) => {
    const timestamp = Date.now();
    
    // Update state immediately for instant UI feedback
    setOpenedChapters(prev => ({
      ...prev,
      [chapterId]: {
        opened: true,
        seriesId,
        timestamp
      }
    }));

    try {
      if (user) {
        // Save to Supabase for authenticated users
        await supabase
          .from('reading_progress')
          .upsert({
            user_id: user.id,
            chapter_id: chapterId,
            current_page: 0,
            total_pages: 1,
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } else {
        // Save to localStorage for guests
        try {
          const stored = localStorage.getItem('opened_chapters');
          let openedList: OpenedChapter[] = stored ? JSON.parse(stored) : [];
          
          // Remove existing entry if present
          openedList = openedList.filter(item => item.chapterId !== chapterId);
          
          // Add new entry
          openedList.push({ chapterId, seriesId, timestamp });
          
          // Keep only last 1000 entries to avoid localStorage bloat
          if (openedList.length > 1000) {
            openedList = openedList.slice(-1000);
          }
          
          localStorage.setItem('opened_chapters', JSON.stringify(openedList));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Error marking chapter as opened:', error);
    }
  }, [user]);

  // Check if a chapter has been opened
  const isChapterOpened = useCallback((chapterId: string): boolean => {
    return openedChapters[chapterId]?.opened || false;
  }, [openedChapters]);

  // Get opened status with timestamp for multiple chapters
  const getOpenedStatus = useCallback((chapterIds: string[]) => {
    const result: Record<string, { opened: boolean; timestamp?: number; seriesId?: string }> = {};
    chapterIds.forEach(id => {
      const status = openedChapters[id];
      result[id] = {
        opened: status?.opened || false,
        timestamp: status?.timestamp,
        seriesId: status?.seriesId
      };
    });
    return result;
  }, [openedChapters]);

  // Load opened chapters on mount and when user changes
  useEffect(() => {
    loadOpenedChapters();
  }, [loadOpenedChapters]);

  // Get the last opened chapter ID for a series or overall
  const getLastOpenedChapterId = useCallback((seriesId?: string): string | null => {
    const entries = Object.entries(openedChapters);
    if (entries.length === 0) return null;

    // Sort by timestamp descending (most recent first)
    let sortedEntries = entries
      .filter(([_, data]) => data.opened)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp);

    if (sortedEntries.length === 0) return null;

    // If seriesId provided, filter by chapters from that series
    if (seriesId) {
      sortedEntries = sortedEntries.filter(([_, data]) => data.seriesId === seriesId);
      if (sortedEntries.length === 0) return null;
    }

    return sortedEntries[0][0];
  }, [openedChapters]);

  return {
    isChapterOpened,
    markChapterOpened,
    getOpenedStatus,
    getLastOpenedChapterId,
    loading,
    refreshOpenedChapters: loadOpenedChapters
  };
};
