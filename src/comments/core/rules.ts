import badWordsSeed from '@/comments/demo/bad-words.json';

export const EMOJIS = ['👍','❤️','😂','😮','😢'] as const;
export type Emoji = typeof EMOJIS[number];
export const LEVEL_THRESHOLD = 25;

export const XP_RULES: Record<string, number> = {
  comment_ok: 1,
  bad_words: -10,
  spoiler_marked: -10,
  spam_dup: -10,
  flagged_spam: -10,
};

export const computeLevel = (xp: number) => Math.floor(xp / LEVEL_THRESHOLD);

export const containsBadWords = (text: string, badWords = new Set<string>(badWordsSeed)): boolean => {
  const t = text.toLowerCase();
  for (const w of badWords) {
    if (!w) continue;
    if (t.includes(w.toLowerCase())) return true;
  }
  return false;
};

const bigrams = (str: string) => {
  const s = str.toLowerCase().replace(/\s+/g, ' ').trim();
  const arr: string[] = [];
  for (let i = 0; i < s.length - 1; i++) arr.push(s.slice(i, i + 2));
  return arr;
};

export const similarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  const setB = new Map<string, number>();
  B.forEach((x) => setB.set(x, (setB.get(x) || 0) + 1));
  let inter = 0;
  for (const x of A) {
    const c = setB.get(x) || 0;
    if (c > 0) {
      inter++;
      setB.set(x, c - 1);
    }
  }
  return (2 * inter) / (A.length + B.length || 1);
};

export const isDuplicate = (text: string, recent: string[], threshold = 0.85) => {
  for (const r of recent) {
    if (text === r) return true;
    if (similarity(text, r) >= threshold) return true;
  }
  return false;
};

export const isTooFast = (prevTs: number | undefined, now: number, minGapMs = 0) => {
  if (!prevTs) return false;
  return now - prevTs < minGapMs;
};
