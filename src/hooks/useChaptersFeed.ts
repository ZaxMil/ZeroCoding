import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { runtime } from '@/config/runtime';
import { chaptersAdapter } from '@/adapters/chapters';

export interface ChapterFeedItem {
  chapter_id: string;
  chapter_title: string;
  chapter_number: number;
  series_id: string;
  series_title: string;
  cover_image_url: string;
  created_at: string;
  is_locked?: boolean;
  unlock_cost?: number;
}

export const useChaptersFeed = (daysBack = 30, limit = 10) => {
  const [chapters, setChapters] = useState<ChapterFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChaptersFeed = async () => {
    try {
      setLoading(true);

      // Mock-first: use local adapter in mock mode
      if (runtime.USE_MOCKS) {
        const merged = await chaptersAdapter.getLatestFeed(daysBack, limit);
        const formatted: ChapterFeedItem[] = merged.map((c: any) => ({
          chapter_id: c.id,
          chapter_title: c.title || `Chapter ${c.chapter_number}`,
          chapter_number: c.chapter_number,
          series_id: c.series_id || 'demo-series',
          series_title: c.series_title || 'Demo Series',
          cover_image_url: c.cover_image_url || '/placeholder.svg',
          created_at: (c.display_published_at || c.release_date),
          is_locked: c.is_locked,
          unlock_cost: c.unlock_cost,
        }));
        setChapters(formatted);
        return;
      }
      
      const { data, error } = await supabase
        .rpc('get_latest_chapters_feed_all', { 
          days_back: daysBack, 
          limit_count: limit 
        });

      if (error) throw error;

      const formattedChapters: ChapterFeedItem[] = data?.map((item: any) => ({
        chapter_id: item.chapter_id,
        chapter_title: item.chapter_title || `Chapter ${item.chapter_number}`,
        chapter_number: item.chapter_number,
        series_id: item.series_id,
        series_title: item.series_title,
        cover_image_url: item.cover_image_url || '/placeholder.svg',
        created_at: item.created_at,
        is_locked: item.is_locked,
        unlock_cost: item.unlock_cost
      })) || [];

      setChapters(formattedChapters);
    } catch (err) {
      console.error('Error fetching chapters feed via RPC:', err);
      toast({
        title: 'Error',
        description: 'Failed to load latest chapters feed',
        variant: 'destructive'
      });
      // Keep existing chapters (if any) to avoid empty UI on transient errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChaptersFeed();
  }, [daysBack, limit]);

  return { chapters, loading, refreshFeed: fetchChaptersFeed };
};