import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ChapterListMode = 'infinite' | 'pagination';

const ROW_KEY = 'series_detail_chapter_list_mode';

export function useSeriesChapterListMode() {
  const [mode, setMode] = useState<ChapterListMode>('infinite');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Prefer feature_toggles table with config_data JSON
      const { data, error } = await supabase
        .from('feature_toggles' as any)
        .select('feature_name, config_data')
        .eq('feature_name', ROW_KEY)
        .maybeSingle();

      if (error) throw error;
      const m = (data as any)?.config_data?.mode as ChapterListMode | undefined;
      setMode(m === 'pagination' ? 'pagination' : 'infinite');
    } catch (e: any) {
      console.warn('Failed to load series chapter list mode, defaulting to infinite', e);
      setMode('infinite');
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMode = useCallback(async (next: ChapterListMode) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('feature_toggles' as any)
        .upsert({ feature_name: ROW_KEY, config_data: { mode: next } }, { onConflict: 'feature_name' } as any);
      if (error) throw error;
      setMode(next);
    } catch (e: any) {
      setError(e?.message || String(e));
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchMode();
  }, [fetchMode]);

  useEffect(() => {
    const channel = supabase
      .channel('series-detail-mode')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_toggles' as any, filter: `feature_name=eq.${ROW_KEY}` }, () => fetchMode())
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [fetchMode]);

  return { mode, loading, saving, error, refetch: fetchMode, saveMode };
}
