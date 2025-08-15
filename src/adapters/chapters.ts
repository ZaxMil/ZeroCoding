// ChaptersAdapter for mock-first feeds and controls
import { buildMockSeries } from '@/lib/mockStorage';

export type OrderDirection = 'asc' | 'desc';

export interface ChaptersAdapter {
  getLatestFeed: (days: number, limit: number) => Promise<any[]>;
  getSeriesLatestChapters: (seriesId: string, limit: number) => Promise<any[]>;
  toggleLock: (seriesId: string, chapterId: string, locked: boolean) => Promise<void>;
  bumpNowFree: (seriesId: string, chapterId: string, hours?: number) => Promise<void>;
  orderSeries: (seriesId: string, direction: OrderDirection) => Promise<void>;
}

const orderKey = (sid: string) => `series:order:${sid}`;

export const chaptersAdapter: ChaptersAdapter = {
  async getLatestFeed(days, limit) {
    // Build a couple of demo series and merge
    const a = buildMockSeries('demo-series-1').chapters;
    const b = buildMockSeries('demo-series-2').chapters;
    const merged = [...a, ...b].filter(c => Date.now() - new Date(c.release_date).getTime() <= days * 86400000);
    return merged.sort((x, y) => new Date((y as any).display_published_at || y.release_date).getTime() - new Date((x as any).display_published_at || x.release_date).getTime()).slice(0, limit);
  },
  async getSeriesLatestChapters(seriesId, limit) {
    const { chapters } = buildMockSeries(seriesId);
    const dir = (localStorage.getItem(orderKey(seriesId)) as OrderDirection) || 'desc';
    const sorted = [...chapters].sort((a, b) => dir === 'asc' ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number);
    return sorted.slice(0, limit);
  },
  async toggleLock(seriesId, chapterId, locked) {
    // Store lock override map per series
    const key = `series:locks:${seriesId}`;
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    map[chapterId] = locked;
    localStorage.setItem(key, JSON.stringify(map));
  },
  async bumpNowFree(seriesId, chapterId, hours = 24) {
    const key = `series:bumps:${seriesId}`;
    const map = JSON.parse(localStorage.getItem(key) || '{}');
    map[chapterId] = { was_locked_now_free: true, display_published_at: new Date().toISOString(), bump_until: new Date(Date.now() + hours * 3600000).toISOString() };
    localStorage.setItem(key, JSON.stringify(map));
  },
  async orderSeries(seriesId, direction) {
    localStorage.setItem(orderKey(seriesId), direction);
  }
};
