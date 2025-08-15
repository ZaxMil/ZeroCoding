import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface SeriesChapterLite {
  id: string;
  title: string | null;
  chapter_number: number;
  page_count: number;
  release_date: string;
  view_count: number | null;
  is_locked: boolean;
  unlock_cost: number; // mapped from chapter_prices.coin_cost, default 0
  thumbnail_url: string | null;
}

const parseIntOr = (v: string | null, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
};

export function useSeriesChaptersPaginated(seriesId?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SeriesChapterLite[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const page = useMemo(() => Math.max(parseIntOr(searchParams.get('page'), 1), 1), [searchParams]);
  const pageSize = useMemo(() => {
    const v = parseIntOr(searchParams.get('size'), 25);
    return [25, 50, 100].includes(v) ? v : 25;
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    next.set('size', String(pageSize));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  useEffect(() => {
    const fetchPage = async () => {
      if (!seriesId) return;
      setLoading(true);
      setError(null);
      try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        const nowIso = new Date().toISOString();
        // Newest first: release_date desc, then chapter_number desc
        const query = supabase
          .from('chapters' as any)
          .select('id, title, chapter_number, page_count, release_date, view_count, is_locked, thumbnail_url, chapter_prices(coin_cost)', { count: 'exact' } as any)
          .eq('series_id', seriesId)
          .order('release_date', { ascending: false })
          .order('chapter_number', { ascending: false })
          .range(from, to);
        const { data, count, error } = await query as any;
        if (error) throw error;
        const mapped: SeriesChapterLite[] = (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          chapter_number: c.chapter_number,
          page_count: c.page_count,
          release_date: c.release_date,
          view_count: c.view_count,
          is_locked: c.is_locked,
          unlock_cost: c.chapter_prices?.coin_cost ?? 0,
          thumbnail_url: c.thumbnail_url,
        }));
        setRows(mapped);
        setTotalCount(count || 0);
      } catch (e: any) {
        console.error('Failed to fetch chapters page', e);
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId, currentPage, pageSize]);

  return {
    rows,
    loading,
    error,
    page: currentPage,
    pageSize,
    setPage: (p: number) => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('page', String(Math.max(1, p))); return next; }),
    setPageSize: (s: number) => setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('size', String(s)); next.set('page', '1'); return next; }),
    totalCount,
    totalPages,
    start,
    end,
  };
}
