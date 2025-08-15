// Lightweight mock persistence using localStorage
// Keyed per user

export interface MockWallet {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export interface MockTransaction {
  id: string;
  amount: number; // positive add, negative spend
  type: 'purchase' | 'spend' | 'refund' | 'reward';
  description?: string;
  reference_id?: string; // chapter id
  created_at: string;
}

const walletKey = (uid: string) => `mock:wallet:${uid}`;
const txKey = (uid: string) => `mock:wallet:tx:${uid}`;
const unlockedKey = (uid: string) => `mock:unlocked:${uid}`;

export const getMockWallet = (uid: string): MockWallet => {
  const raw = localStorage.getItem(walletKey(uid));
  if (raw) return JSON.parse(raw);
  const w: MockWallet = { balance: 200, lifetime_earned: 0, lifetime_spent: 0 };
  localStorage.setItem(walletKey(uid), JSON.stringify(w));
  return w;
};

export const setMockWallet = (uid: string, w: MockWallet) => {
  localStorage.setItem(walletKey(uid), JSON.stringify(w));
};

export const getMockTransactions = (uid: string): MockTransaction[] => {
  const raw = localStorage.getItem(txKey(uid));
  return raw ? JSON.parse(raw) : [];
};

export const addMockTransaction = (uid: string, tx: Omit<MockTransaction, 'id'|'created_at'>) => {
  const list = getMockTransactions(uid);
  const full: MockTransaction = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...tx };
  localStorage.setItem(txKey(uid), JSON.stringify([full, ...list].slice(0, 200)));
  // Update wallet
  const w = getMockWallet(uid);
  const newBalance = (w.balance || 0) + (tx.amount || 0);
  const spent = w.lifetime_spent + (tx.amount < 0 ? Math.abs(tx.amount) : 0);
  const earned = w.lifetime_earned + (tx.amount > 0 ? tx.amount : 0);
  setMockWallet(uid, { balance: newBalance, lifetime_earned: earned, lifetime_spent: spent });
};

export const getUnlockedChapters = (uid: string): Record<string, true> => {
  const raw = localStorage.getItem(unlockedKey(uid));
  return raw ? JSON.parse(raw) : {};
};

export const addUnlockedChapter = (uid: string, chapterId: string) => {
  const map = getUnlockedChapters(uid);
  map[chapterId] = true;
  localStorage.setItem(unlockedKey(uid), JSON.stringify(map));
};

// Sample content mocks
export interface MockChapter {
  id: string;
  title: string;
  chapter_number: number;
  page_count: number;
  release_date: string;
  is_locked: boolean;
  unlock_cost: number;
  thumbnail_url: string;
  // bump fields
  display_published_at?: string;
  bump_until?: string;
  was_locked_now_free?: boolean;
}
export interface MockSeries {
  id: string;
  title: string;
  description: string;
  author: string;
  cover_image_url: string;
  status: 'ongoing' | 'completed';
  genres: string[];
  view_count: number;
  rating_average: number;
  rating_count: number;
  slug?: string;
}

export const buildMockSeries = (id: string): { series: MockSeries; chapters: MockChapter[] } => {
  const series: MockSeries = {
    id,
    slug: id,
    title: `Demo Series ${id.slice(0, 4).toUpperCase()}`,
    description: 'Offline demo series using mock data. No backend required.',
    author: 'Kodelex Author',
    cover_image_url: '/placeholder.svg',
    status: 'ongoing',
    genres: ['Action', 'Fantasy', 'Manga'],
    view_count: 12034,
    rating_average: 4.7,
    rating_count: 234
  };
  const now = Date.now();
  const chapters: MockChapter[] = Array.from({ length: 24 }).map((_, idx) => {
    const n = 24 - idx;
    const wasLockedNowFree = n === 20; // one recent free promo
    const isLocked = n > 4 && !wasLockedNowFree;
    const release = new Date(now - idx * 86400000).toISOString();
    const displayPub = wasLockedNowFree ? new Date(now - 1 * 3600000).toISOString() : release;
    return {
      id: `${id}-ch-${n}`,
      title: `Interesting Chapter ${n}`,
      chapter_number: n,
      page_count: 30 + (n % 10),
      release_date: release,
      is_locked: isLocked,
      unlock_cost: isLocked ? 10 : 0,
      thumbnail_url: '/placeholder.svg',
      display_published_at: displayPub,
      bump_until: wasLockedNowFree ? new Date(now + 24 * 3600000).toISOString() : undefined,
      was_locked_now_free: wasLockedNowFree,
    };
  });
  return { series, chapters };
};