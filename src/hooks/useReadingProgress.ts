import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ReadingProgress {
  series_id: string;
  chapter_number: number;
  page_number: number;
  progress_percentage: number;
  last_read_at: string;
  reading_time: number; // in minutes
}

interface ReadingStats {
  total_series: number;
  total_chapters_read: number;
  total_reading_time: number;
  favorite_genre: string;
  reading_streak: number;
  chapters_this_week: number;
  pages_this_week: number;
}

export function useReadingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<string, ReadingProgress>>(new Map());
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load progress from localStorage (in real app, this would be Supabase)
  useEffect(() => {
    if (!user) {
      setProgress(new Map());
      setStats(null);
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        // Mock loading from localStorage
        const stored = localStorage.getItem(`reading_progress_${user.id}`);
        const progressData = stored ? JSON.parse(stored) : {};
        
        const progressMap = new Map();
        Object.entries(progressData).forEach(([seriesId, data]) => {
          progressMap.set(seriesId, data);
        });
        
        setProgress(progressMap);
        
        // Calculate stats
        const mockStats: ReadingStats = {
          total_series: progressMap.size,
          total_chapters_read: Array.from(progressMap.values()).reduce((sum, p: any) => sum + p.chapter_number, 0),
          total_reading_time: Array.from(progressMap.values()).reduce((sum, p: any) => sum + (p.reading_time || 0), 0),
          favorite_genre: 'Action',
          reading_streak: 7,
          chapters_this_week: 12,
          pages_this_week: 456
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to load reading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  const updateProgress = async (
    seriesId: string, 
    chapterNumber: number, 
    pageNumber: number,
    totalPages: number
  ) => {
    if (!user) return;

    const progressPercentage = totalPages > 0 ? (pageNumber / totalPages) * 100 : 0;
    
    const newProgress: ReadingProgress = {
      series_id: seriesId,
      chapter_number: chapterNumber,
      page_number: pageNumber,
      progress_percentage: progressPercentage,
      last_read_at: new Date().toISOString(),
      reading_time: progress.get(seriesId)?.reading_time || 0
    };

    // Update local state
    const newProgressMap = new Map(progress);
    newProgressMap.set(seriesId, newProgress);
    setProgress(newProgressMap);

    // Save to localStorage (in real app, this would be Supabase)
    try {
      const progressData: Record<string, ReadingProgress> = {};
      newProgressMap.forEach((value, key) => {
        progressData[key] = value;
      });
      
      localStorage.setItem(`reading_progress_${user.id}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save reading progress:', error);
    }
  };

  const markChapterComplete = async (seriesId: string, chapterNumber: number, readingTime: number = 0) => {
    if (!user) return;

    const existingProgress = progress.get(seriesId);
    const newProgress: ReadingProgress = {
      series_id: seriesId,
      chapter_number: chapterNumber,
      page_number: 0, // Reset for next chapter
      progress_percentage: 100,
      last_read_at: new Date().toISOString(),
      reading_time: (existingProgress?.reading_time || 0) + readingTime
    };

    const newProgressMap = new Map(progress);
    newProgressMap.set(seriesId, newProgress);
    setProgress(newProgressMap);

    // Save to localStorage
    try {
      const progressData: Record<string, ReadingProgress> = {};
      newProgressMap.forEach((value, key) => {
        progressData[key] = value;
      });
      
      localStorage.setItem(`reading_progress_${user.id}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save reading progress:', error);
    }
  };

  const getSeriesProgress = (seriesId: string): ReadingProgress | null => {
    return progress.get(seriesId) || null;
  };

  const getReadingStats = (): ReadingStats | null => {
    return stats;
  };

  const resetProgress = async (seriesId: string) => {
    if (!user) return;

    const newProgressMap = new Map(progress);
    newProgressMap.delete(seriesId);
    setProgress(newProgressMap);

    // Save to localStorage
    try {
      const progressData: Record<string, ReadingProgress> = {};
      newProgressMap.forEach((value, key) => {
        progressData[key] = value;
      });
      
      localStorage.setItem(`reading_progress_${user.id}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to reset reading progress:', error);
    }
  };

  const getAllProgress = (): ReadingProgress[] => {
    return Array.from(progress.values());
  };

  return {
    progress: getAllProgress(),
    stats,
    loading,
    updateProgress,
    markChapterComplete,
    getSeriesProgress,
    getReadingStats,
    resetProgress
  };
}