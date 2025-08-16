import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ReadingStats {
  total_series: number;
  total_chapters_read: number;
  total_reading_time: number;
  favorite_genre: string;
  reading_streak: number;
  chapters_this_week: number;
  pages_this_week: number;
}

export function useReadingStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        // Mock stats for now - replace with actual API calls
        const mockStats: ReadingStats = {
          total_series: 12,
          total_chapters_read: 156,
          total_reading_time: 4320, // minutes
          favorite_genre: 'Action',
          reading_streak: 7,
          chapters_this_week: 12,
          pages_this_week: 456
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to load reading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return { stats, loading };
}