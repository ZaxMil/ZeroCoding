import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';

export type SortField = 'release_date' | 'chapter_number' | 'title' | 'is_locked' | 'coin_cost' | 'views' | 'sales';
export type SortDir = 'asc' | 'desc';

export interface ChapterLite {
  id: string;
  chapter_number: number;
  title: string | null;
  release_date: string;
  is_locked: boolean;
  thumbnail_url: string | null;
  lock_reason: string | null;
  lock_after: string | null;
  unlock_after: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  notes_admin: string | null;
  body_content: string | null;
}

export interface ChapterRowData {
  id: string;
  chapter_number: number;
  title: string | null;
  release_date: string;
  is_locked: boolean;
  coin_cost: number | null;
  sales: number;
  views: number;
  thumbnail_url: string | null;
  lock_reason: string | null;
  lock_after: string | null;
  unlock_after: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  notes_admin: string | null;
  body_content: string | null;
}

export interface Filters {
  q: string;
  status: 'any' | 'locked' | 'free';
  price: 'any' | 'free' | 'paid';
  published: 'any' | 'published' | 'scheduled';
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  sales: 'any' | 'none';
  views: 'any' | 'none';
}

const DEFAULT_FILTERS: Filters = {
  q: '',
  status: 'any',
  price: 'any',
  published: 'any',
  from: undefined,
  to: undefined,
  sales: 'any',
  views: 'any',
};

const parseIntOr = (v: string | null, d: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
};

export function useChapterAdminList(seriesId: string | undefined, enabled: boolean) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(() => Math.max(parseIntOr(searchParams.get('cm_page'), 1), 1));
  const [pageSize, setPageSize] = useState(() => {
    const v = parseIntOr(searchParams.get('cm_size'), 25);
    return [25, 50, 100].includes(v) ? v : 25;
  });
  const [sortField, setSortField] = useState<SortField>(() => (searchParams.get('cm_sort') as SortField) || 'release_date');
  const [sortDir, setSortDir] = useState<SortDir>(() => (searchParams.get('cm_dir') as SortDir) || 'desc');
  const [filters, setFilters] = useState<Filters>(() => ({
    q: searchParams.get('cm_q') || '',
    status: (searchParams.get('cm_status') as Filters['status']) || 'any',
    price: (searchParams.get('cm_price') as Filters['price']) || 'any',
    published: (searchParams.get('cm_pub') as Filters['published']) || 'any',
    from: searchParams.get('cm_from') || undefined,
    to: searchParams.get('cm_to') || undefined,
    sales: (searchParams.get('cm_sales') as Filters['sales']) || 'any',
    views: (searchParams.get('cm_views') as Filters['views']) || 'any',
  }));

  // URL sync
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('cm_page', String(page));
    next.set('cm_size', String(pageSize));
    next.set('cm_sort', sortField);
    next.set('cm_dir', sortDir);
    next.set('cm_q', filters.q);
    next.set('cm_status', filters.status);
    next.set('cm_price', filters.price);
    next.set('cm_pub', filters.published);
    if (filters.from) next.set('cm_from', filters.from); else next.delete('cm_from');
    if (filters.to) next.set('cm_to', filters.to); else next.delete('cm_to');
    next.set('cm_sales', filters.sales);
    next.set('cm_views', filters.views);
    setSearchParams(next, { replace: true });
  }, [page, pageSize, sortField, sortDir, filters, setSearchParams]);

  // Data state
  const [loading, setLoading] = useState(false);
  const [baseChapters, setBaseChapters] = useState<ChapterLite[]>([]);
  const priceMapRef = useRef<Map<string, number | null>>(new Map());
  const salesMapRef = useRef<Map<string, number>>(new Map());
  const viewsMapRef = useRef<Map<string, number>>(new Map());

  const refresh = useCallback(async () => {
    if (!seriesId || !enabled) return;
    setLoading(true);
    try {
      // 1) Base chapters with server-side filters that are simple
      let query = supabase
        .from('chapters')
        .select('id, chapter_number, title, release_date, is_locked, created_at, updated_at')
        .eq('series_id', seriesId);

      // Search: title ilike or exact chapter_number
      const q = filters.q.trim();
      if (q) {
        const isNumber = /^\d+$/.test(q);
        if (isNumber) {
          query = query.or(`title.ilike.%${q}%,chapter_number.eq.${q}`);
        } else {
          query = query.ilike('title', `%${q}%`);
        }
      }
      // Status
      if (filters.status === 'locked') query = query.eq('is_locked', true);
      if (filters.status === 'free') query = query.eq('is_locked', false);
      // Published state
      const nowIso = new Date().toISOString();
      if (filters.published === 'published') query = query.lte('release_date', nowIso);
      if (filters.published === 'scheduled') query = query.gt('release_date', nowIso);
      // Date range
      if (filters.from) query = query.gte('release_date', `${filters.from}T00:00:00.000Z`);
      if (filters.to) query = query.lte('release_date', `${filters.to}T23:59:59.999Z`);

      const { data: chaptersData, error: chErr } = await query.order('release_date', { ascending: false }).order('chapter_number', { ascending: false });
      if (chErr) throw chErr;
      const base = (chaptersData || []).map(c => ({
        id: c.id as string,
        chapter_number: c.chapter_number as number,
        title: c.title as string | null,
        release_date: c.release_date as string,
        is_locked: (c as any).is_locked as boolean,
        thumbnail_url: null as string | null,
        lock_reason: null as string | null,
        lock_after: null as string | null,
        unlock_after: null as string | null,
        created_at: (c as any).created_at as string,
        updated_at: (c as any).updated_at as string,
        meta_title: null as string | null,
        meta_description: null as string | null,
        meta_keywords: null as string | null,
        notes_admin: null as string | null,
        body_content: null as string | null,
      }));
      setBaseChapters(base);

      const baseIds = base.map(b => b.id);

      // 2) Prices for base set
      const priceMap = new Map<string, number | null>();
      if (baseIds.length) {
        const { data: prices, error: pErr } = await supabase
          .from('chapter_prices' as any)
          .select('chapter_id, coin_cost')
          .in('chapter_id', baseIds);
        if (pErr) throw pErr;
        (prices || []).forEach((p: any) => priceMap.set(p.chapter_id, p.coin_cost ?? null));
      }
      priceMapRef.current = priceMap;

      // 3) Sales counts for base set
      const salesMap = new Map<string, number>();
      if (baseIds.length) {
        const { data: spends, error: sErr } = await supabase
          .from('coin_transactions' as any)
          .select('reference_id')
          .eq('type', 'spend')
          .in('reference_id', baseIds);
        if (sErr) throw sErr;
        (spends || []).forEach((t: any) => {
          const cid = t.reference_id;
          salesMap.set(cid, (salesMap.get(cid) || 0) + 1);
        });
      }
      salesMapRef.current = salesMap;

      // 4) Views counts for base set (unique readers)
      const viewsMap = new Map<string, number>();
      if (baseIds.length) {
        const { data: progress, error: vErr } = await supabase
          .from('reading_progress' as any)
          .select('chapter_id, user_id')
          .in('chapter_id', baseIds);
        if (vErr) throw vErr;
        const seenByChapter = new Map<string, Set<string>>();
        (progress || []).forEach((rp: any) => {
          const cid = rp.chapter_id;
          const uid = rp.user_id;
          if (!seenByChapter.has(cid)) seenByChapter.set(cid, new Set());
          seenByChapter.get(cid)!.add(uid);
        });
        seenByChapter.forEach((set, cid) => viewsMap.set(cid, set.size));
      }
      viewsMapRef.current = viewsMap;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId, enabled, filters.q, filters.status, filters.published, filters.from, filters.to]);

  // Compute filtered + sorted ids
  const filteredSorted = useMemo(() => {
    const priceMap = priceMapRef.current;
    const salesMap = salesMapRef.current;
    const viewsMap = viewsMapRef.current;

    let ids = baseChapters.map(b => b.id);

    // Price filter
    if (filters.price !== 'any') {
      ids = ids.filter(id => {
        const cc = priceMap.get(id);
        const val = cc == null ? 0 : cc;
        return filters.price === 'free' ? val === 0 : val > 0;
      });
    }
    // Sales filter
    if (filters.sales !== 'any') {
      ids = ids.filter(id => {
        const n = salesMap.get(id) || 0;
        return filters.sales === 'none' ? n === 0 : n > 0;
      });
    }
    // Views filter
    if (filters.views !== 'any') {
      ids = ids.filter(id => {
        const n = viewsMap.get(id) || 0;
        return filters.views === 'none' ? n === 0 : n > 0;
      });
    }

    const mapLite = new Map(baseChapters.map(b => [b.id, b] as const));

    const cmp = (a: string, b: string) => {
      const A = mapLite.get(a)!;
      const B = mapLite.get(b)!;
      let res = 0;
      switch (sortField) {
        case 'release_date':
          res = (A.release_date || '').localeCompare(B.release_date || '');
          break;
        case 'chapter_number':
          res = (A.chapter_number || 0) - (B.chapter_number || 0);
          break;
        case 'title':
          res = (A.title || '').localeCompare(B.title || '');
          break;
        case 'is_locked':
          res = Number(A.is_locked) - Number(B.is_locked);
          break;
        case 'coin_cost':
          res = (priceMap.get(a) ?? 0) - (priceMap.get(b) ?? 0);
          break;
        case 'views':
          res = (viewsMap.get(a) || 0) - (viewsMap.get(b) || 0);
          break;
        case 'sales':
          res = (salesMap.get(a) || 0) - (salesMap.get(b) || 0);
          break;
      }
      if (sortDir === 'desc') res = -res;
      // Stable secondary sort by release_date desc then chapter_number desc
      if (res === 0) {
        const r = (A.release_date || '').localeCompare(B.release_date || '');
        res = sortDir === 'desc' ? -r : r;
        if (res === 0) res = (A.chapter_number || 0) - (B.chapter_number || 0);
      }
      return res;
    };

    const sorted = ids.slice().sort(cmp);
    return { ids: sorted, total: sorted.length };
  }, [baseChapters, filters.price, filters.sales, filters.views, sortField, sortDir]);

  const totalCount = filteredSorted.total;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);
  const pageIds = filteredSorted.ids.slice(start, end);

  const rows: ChapterRowData[] = useMemo(() => {
    const priceMap = priceMapRef.current;
    const salesMap = salesMapRef.current;
    const viewsMap = viewsMapRef.current;
    const lite = new Map(baseChapters.map(b => [b.id, b] as const));
    return pageIds.map(id => {
      const b = lite.get(id)!;
      return {
        id,
        chapter_number: b.chapter_number,
        title: b.title,
        release_date: b.release_date,
        is_locked: b.is_locked,
        coin_cost: priceMap.get(id) ?? 0,
        sales: salesMap.get(id) || 0,
        views: viewsMap.get(id) || 0,
        thumbnail_url: b.thumbnail_url,
        lock_reason: b.lock_reason,
        lock_after: b.lock_after,
        unlock_after: b.unlock_after,
        created_at: b.created_at,
        updated_at: b.updated_at,
        meta_title: b.meta_title,
        meta_description: b.meta_description,
        meta_keywords: b.meta_keywords,
        notes_admin: b.notes_admin,
        body_content: b.body_content,
      };
    });
  }, [pageIds, baseChapters]);

  // Realtime and interval refresh
  useEffect(() => {
    if (!enabled || !seriesId) return;
    const channel = supabase
      .channel(`series-chapters-${seriesId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters', filter: `series_id=eq.${seriesId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapter_prices' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coin_transactions' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_progress' }, () => refresh())
      .subscribe();
    const interval = setInterval(() => refresh(), 60000);
    return () => {
      try { supabase.removeChannel(channel); } catch {}
      clearInterval(interval);
    };
  }, [enabled, seriesId, refresh]);

  // Public setters (reset page on changes that affect result set)
  const updateFilters = (patch: Partial<Filters>) => {
    setPage(1);
    setFilters(prev => ({ ...prev, ...patch }));
  };
  const resetFilters = () => {
    setPage(1);
    setFilters({ ...DEFAULT_FILTERS, q: '' });
  };
  const updateSort = (field: SortField) => {
    setPage(1);
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return field;
    });
  };

  // Local optimistic update helper
  const applyLocalUpdate = (id: string, patch: Partial<ChapterRowData>) => {
    setBaseChapters(prev => prev.map(b => b.id === id ? {
      ...b,
      title: patch.title !== undefined ? patch.title : b.title,
      is_locked: patch.is_locked !== undefined ? patch.is_locked : b.is_locked,
      release_date: patch.release_date !== undefined ? patch.release_date : b.release_date,
    } : b));
    if (patch.coin_cost !== undefined) {
      const map = new Map(priceMapRef.current);
      map.set(id, patch.coin_cost);
      priceMapRef.current = map;
    }
    // counts are not updated here; they are server-derived
  };

  // External API
  return {
    loading,
    rows,
    totalCount,
    page: currentPage,
    pageSize,
    start: totalCount === 0 ? 0 : start + 1,
    end,
    totalPages,
    sortField,
    sortDir,
    filters,
    setPage,
    setPageSize: (n: number) => { setPage(1); setPageSize(n); },
    updateFilters,
    resetFilters,
    updateSort,
    refresh,
    applyLocalUpdate,
  };
}
