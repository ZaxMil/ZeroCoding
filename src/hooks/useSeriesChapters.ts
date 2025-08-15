import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { runtime } from '@/config/runtime';
import { chaptersAdapter } from '@/adapters/chapters';


export interface SeriesChapter {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string;
  pages: string[];
  page_count: number;
  release_date: string;
  is_locked: boolean;
  sort_order: number;
}

export const useSeriesChapters = (seriesId?: string) => {
  const [chapters, setChapters] = useState<SeriesChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSeriesChapters = async () => {
    if (!seriesId) {
      setChapters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (runtime.USE_MOCKS) {
        const list = await chaptersAdapter.getSeriesLatestChapters(seriesId, 999);
        const formatted: SeriesChapter[] = list.map((chapter: any) => ({
          id: chapter.id,
          series_id: seriesId,
          chapter_number: chapter.chapter_number,
          title: chapter.title || `Chapter ${chapter.chapter_number}`,
          pages: Array.isArray(chapter.pages) ? chapter.pages : [],
          page_count: chapter.page_count || 0,
          release_date: chapter.release_date,
          is_locked: !!chapter.is_locked,
          sort_order: chapter.sort_order || chapter.chapter_number,
        }));
        setChapters(formatted);
        return;
      }

      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('series_id', seriesId)
        .order('chapter_number', { ascending: true });

      if (error) {
        console.error('Error fetching series chapters:', error);
        setError('Failed to load chapters');
        return;
      }

      const formattedChapters: SeriesChapter[] = data?.map(chapter => {
        // Handle pages field - it might be JSON string or array
        let pages: string[] = [];
        if (chapter.pages) {
          if (typeof chapter.pages === 'string') {
            try {
              const parsed = JSON.parse(chapter.pages);
              pages = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
            } catch (e) {
              console.warn('Failed to parse pages JSON for chapter', chapter.id, e);
              pages = [];
            }
          } else if (Array.isArray(chapter.pages)) {
            pages = chapter.pages.filter((p): p is string => typeof p === 'string');
          }
        }

        return {
          id: chapter.id,
          series_id: chapter.series_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title || `Chapter ${chapter.chapter_number}`,
          pages,
          page_count: pages.length || (chapter as any).page_count || 0,
          release_date: chapter.release_date,
          is_locked: (chapter as any).is_locked || false,
          sort_order: (chapter as any).sort_order || chapter.chapter_number,
        } as SeriesChapter;
      }) || [];

      console.log(`Fetched ${formattedChapters.length} chapters for series ${seriesId}`);
      setChapters(formattedChapters);
    } catch (err) {
      console.error('Error fetching series chapters:', err);
      setError('Failed to load chapters');
      toast({
        title: "Error",
        description: "Failed to load chapters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getChapterById = (chapterId: string) => {
    return chapters.find(chapter => chapter.id === chapterId);
  };

  const getChapterByNumber = (chapterNumber: number) => {
    return chapters.find(chapter => chapter.chapter_number === chapterNumber);
  };

  useEffect(() => {
    fetchSeriesChapters();
  }, [seriesId]);

  // Realtime updates for chapters list + cross-tab events
  useEffect(() => {
    if (!seriesId) return;

    const channel = supabase
      .channel(`series-chapters-${seriesId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters', filter: `series_id=eq.${seriesId}` }, () => {
        fetchSeriesChapters();
      })
      .subscribe();

    const handler = (e: any) => {
      try {
        if (e.detail?.seriesId === seriesId) {
          fetchSeriesChapters();
        }
      } catch {}
    };
    window.addEventListener('chapters:updated', handler);

    return () => {
      try { supabase.removeChannel(channel); } catch {}
      window.removeEventListener('chapters:updated', handler);
    };
  }, [seriesId]);

  return {
    chapters,
    loading,
    error,
    refreshChapters: fetchSeriesChapters,
    getChapterById,
    getChapterByNumber,
  };
};