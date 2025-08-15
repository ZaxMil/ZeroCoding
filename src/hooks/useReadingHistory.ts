import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Local storage schema: { [seriesId]: { chapterId, page, totalPages, updatedAt, pinned?: boolean } }
const LS_KEY = 'reading_history_v1';
const PIN_KEY = 'reading_history_pins_v1';

type LocalHistoryEntry = {
  chapterId: string;
  page: number;
  totalPages?: number;
  updatedAt: string;
  pinned?: boolean;
};

export type SeriesHistory = Record<string, LocalHistoryEntry>;

export const loadLocalHistory = (): SeriesHistory => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveLocalHistory = (data: SeriesHistory) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
};

const loadPins = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const savePins = (pins: Record<string, boolean>) => {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(pins)); } catch {}
};

export interface HistoryItem {
  seriesId: string;
  chapterId: string;
  page: number;
  totalPages?: number;
  updatedAt: string;
  pinned?: boolean;
}

export const useReadingHistory = (userId?: string) => {
  const [local, setLocal] = useState<SeriesHistory>(() => loadLocalHistory());
  const [pins, setPins] = useState<Record<string, boolean>>(() => loadPins());
  const saveTimer = useRef<number | null>(null);

  // Debounced persist
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveLocalHistory(local), 300);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [local]);

  useEffect(() => { savePins(pins); }, [pins]);

  const items = useMemo<HistoryItem[]>(() => {
    return Object.entries(local).map(([seriesId, entry]) => ({
      seriesId,
      ...entry,
      pinned: pins[seriesId] || entry.pinned,
    })).sort((a, b) => (pins[b.seriesId]?1:0) - (pins[a.seriesId]?1:0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [local, pins]);

  const update = (seriesId: string, chapterId: string, page: number, totalPages?: number) => {
    setLocal(prev => ({
      ...prev,
      [seriesId]: {
        chapterId,
        page,
        totalPages,
        updatedAt: new Date().toISOString(),
        pinned: prev[seriesId]?.pinned,
      }
    }));
  };

  const clearSeries = async (seriesId: string) => {
    setLocal(prev => { const c = { ...prev }; delete c[seriesId]; return c; });
    setPins(prev => { const c = { ...prev }; delete c[seriesId]; return c; });
    if (userId) {
      // Best-effort remove remote progress entries for this series (reading_progress joined via chapters)
      try {
        const { data: ch, error: chErr } = await supabase
          .from('chapters')
          .select('id')
          .eq('series_id', seriesId);
        if (!chErr && ch && ch.length) {
          await supabase
            .from('reading_progress' as any)
            .delete()
            .eq('user_id', userId)
            .in('chapter_id', ch.map(c => c.id));
        }
      } catch {}
    }
  };

  const togglePin = (seriesId: string) => setPins(prev => ({ ...prev, [seriesId]: !prev[seriesId] }));

  // Merge guest local history into remote reading_progress for signed-in users; then clear local
  const mergeGuestIntoRemote = async () => {
    if (!userId) return;
    const guest = loadLocalHistory();
    const entries = Object.entries(guest);
    if (!entries.length) return;
    try {
      // For each series, upsert progress row for last-read chapter
      for (const [seriesId, entry] of entries) {
        await supabase
          .from('reading_progress' as any)
          .upsert({
            user_id: userId,
            chapter_id: entry.chapterId,
            current_page: (entry.page || 0) + 1,
            total_pages: entry.totalPages || null,
            completed: entry.totalPages ? (entry.page >= (entry.totalPages - 1)) : false,
            last_read_at: entry.updatedAt || new Date().toISOString(),
          });
      }
      // Clear local guest copy after successful merge
      localStorage.removeItem(LS_KEY);
      setLocal({});
    } catch {}
  };

  const getContinueTarget = (seriesId: string) => {
    const e = local[seriesId];
    if (!e) return null;
    return { seriesId, chapterId: e.chapterId, page: e.page };
  };

  return { items, update, clearSeries, togglePin, pins, mergeGuestIntoRemote, getContinueTarget };
};
