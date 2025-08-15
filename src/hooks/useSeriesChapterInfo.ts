import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SeriesInfo {
  id: string;
  title: string;
  slug?: string;
}

interface ChapterInfo {
  id: string;
  chapter_number: number;
  title: string;
  series_id: string;
}

interface SeriesChapterInfo {
  series: SeriesInfo | null;
  chapter: ChapterInfo | null;
  loading: boolean;
  error: string | null;
}

export const useSeriesChapterInfo = (targetId: string, targetType: 'series' | 'chapter'): SeriesChapterInfo => {
  const [data, setData] = useState<SeriesChapterInfo>({
    series: null,
    chapter: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        if (targetType === 'series') {
          // Fetch series info directly
          const { data: seriesData, error: seriesError } = await supabase
            .from('manga_meta')
            .select('id, title')
            .eq('id', targetId)
            .single();

          if (seriesError) throw seriesError;

          setData({
            series: seriesData,
            chapter: null,
            loading: false,
            error: null
          });
        } else {
          // Fetch chapter info and related series info
          const { data: chapterData, error: chapterError } = await supabase
            .from('chapters')
            .select(`
              id,
              chapter_number,
              title,
              series_id,
              manga_meta!inner(
                id,
                title
              )
            `)
            .eq('id', targetId)
            .single();

          if (chapterError) throw chapterError;

          setData({
            series: chapterData.manga_meta,
            chapter: {
              id: chapterData.id,
              chapter_number: chapterData.chapter_number,
              title: chapterData.title,
              series_id: chapterData.series_id
            },
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error fetching series/chapter info:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load series information'
        }));
      }
    };

    if (targetId) {
      fetchData();
    }
  }, [targetId, targetType]);

  return data;
};