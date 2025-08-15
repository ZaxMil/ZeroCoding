import { createStore, get, set, del, update, keys } from 'idb-keyval';
import { CommentStore } from './CommentStore';
import {
  Comment,
  Reaction,
  Query,
  XP,
  Report,
  Ban,
  Block,
  makeScopeKey,
} from '@/comments/core/types';
import { EMOJIS } from '@/comments/core/rules';

const dbComments = createStore('commentsDB', 'comments');
const dbReactions = createStore('commentsDB', 'reactions');
const dbXP = createStore('commentsDB', 'xp');
const dbReports = createStore('commentsDB', 'reports');
const dbBans = createStore('commentsDB', 'bans');
const dbBlocks = createStore('commentsDB', 'blocks');
const dbMeta = createStore('commentsDB', 'meta');
const dbAttachments = createStore('commentsDB', 'attachments');

// Meta keys
const META_SCOPE_PREFIX = 'scope:'; // scopeKey -> string[] of commentIds
const META_USER_PREFIX = 'user:'; // userId -> string[] of commentIds

const getMeta = async <T>(key: string, fallback: T): Promise<T> => (await get(key, dbMeta)) ?? fallback;
const setMeta = async (key: string, value: any) => set(key, value, dbMeta);

const addToIndex = async (key: string, id: string) => {
  const list = await getMeta<string[]>(key, []);
  if (!list.includes(id)) {
    list.unshift(id);
    await setMeta(key, list);
  }
};

const removeFromIndex = async (key: string, id: string) => {
  const list = await getMeta<string[]>(key, []);
  const next = list.filter((x) => x !== id);
  await setMeta(key, next);
};

const reactionKey = (r: Reaction) => `${r.commentId}:${r.userId}:${r.emoji}`;

export class IndexedDBStore implements CommentStore {
  async hasReaction(commentId: string, userId: string, emoji: Reaction['emoji']): Promise<boolean> {
    const key = reactionKey({ commentId, userId, emoji, ts: 0 } as Reaction);
    const exists = await get(key, dbReactions);
    return !!exists;
  }
  async addComment(c: Comment): Promise<void> {
    await set(c.id, c, dbComments);
    const scopeKey = META_SCOPE_PREFIX + makeScopeKey(c.scope);
    const userKey = META_USER_PREFIX + c.userId;
    await Promise.all([addToIndex(scopeKey, c.id), addToIndex(userKey, c.id)]);
  }

  async updateComment(c: Comment): Promise<void> {
    await set(c.id, c, dbComments);
  }

  async getComments(q: Query): Promise<{ rows: Comment[]; total: number }> {
    const { scope, userId, parentId, text, since, until, flagged, limit = 20, offset = 0 } = q;
    let ids: string[] | null = null;
    if (scope) ids = await getMeta<string[]>(META_SCOPE_PREFIX + makeScopeKey(scope), []);
    if (!ids) {
      const allKeys = (await keys(dbComments)) as string[];
      ids = allKeys;
    }
    let rows: Comment[] = [];
    // quick slice window to avoid loading everything
    const windowIds = ids.slice(offset, offset + limit * 2); // overfetch a bit
    const fetched = await Promise.all(windowIds.map((id) => get<Comment>(id, dbComments)));
    rows = fetched.filter(Boolean) as Comment[];

    rows = rows.filter((c) => {
      if (typeof parentId !== 'undefined' && c.parentId !== parentId) return false;
      if (userId && c.userId !== userId) return false;
      if (typeof flagged !== 'undefined' && (c.flags > 0) !== !!flagged) return false;
      if (since && c.createdAt < since) return false;
      if (until && c.createdAt > until) return false;
      if (text && !c.content.toLowerCase().includes(text.toLowerCase())) return false;
      return true;
    });

    // Sort newest first
    rows.sort((a, b) => b.createdAt - a.createdAt);

    const total = ids.length; // approximate if filters applied
    return { rows: rows.slice(0, limit), total };
  }

  async addReaction(r: Reaction): Promise<void> {
    const key = reactionKey(r);
    const exists = await get(key, dbReactions);
    if (exists) return;
    await set(key, 1, dbReactions);
    // bump counters
    await update(r.commentId, (c?: Comment) => {
      if (!c) return c;
      if (!c.reactions) c.reactions = Object.fromEntries(EMOJIS.map((e) => [e, 0])) as any;
      c.reactions[r.emoji] = (c.reactions[r.emoji] || 0) + 1;
      c.updatedAt = Date.now();
      return c;
    }, dbComments);
  }

  async removeReaction(r: Reaction): Promise<void> {
    const key = reactionKey(r);
    const exists = await get(key, dbReactions);
    if (!exists) return;
    await del(key, dbReactions);
    await update(r.commentId, (c?: Comment) => {
      if (!c) return c;
      if (!c.reactions) c.reactions = Object.fromEntries(EMOJIS.map((e) => [e, 0])) as any;
      c.reactions[r.emoji] = Math.max(0, (c.reactions[r.emoji] || 0) - 1);
      c.updatedAt = Date.now();
      return c;
    }, dbComments);
  }

  async getUserXP(userId: string): Promise<XP> {
    const x = (await get(userId, dbXP)) as XP | undefined;
    return (
      x ?? {
        userId,
        xp: 0,
        level: 0,
        updatedAt: Date.now(),
      }
    );
  }

  async setUserXP(x: XP): Promise<void> {
    await set(x.userId, x, dbXP);
  }

  async reportComment(rep: Report): Promise<void> {
    await set(rep.id, rep, dbReports);
    // bump flags
    await update(rep.commentId, (c?: Comment) => {
      if (!c) return c;
      c.flags = (c.flags || 0) + 1;
      return c;
    }, dbComments);
  }

  async setBan(ban: Ban): Promise<void> {
    await set(ban.id, ban, dbBans);
  }

  async getBans(): Promise<Ban[]> {
    const ks = (await keys(dbBans)) as string[];
    const items = await Promise.all(ks.map((k) => get<Ban>(k, dbBans)));
    return items.filter(Boolean) as Ban[];
  }

  async setBlock(block: Block): Promise<void> {
    await set(`${block.blockerId}:${block.blockedId}`, block, dbBlocks);
  }

  async getBlocks(blockerId: string): Promise<Block[]> {
    const ks = (await keys(dbBlocks)) as string[];
    const my = ks.filter((k) => k.startsWith(blockerId + ':'));
    const items = await Promise.all(my.map((k) => get<Block>(k, dbBlocks)));
    return items.filter(Boolean) as Block[];
  }

  async seed(data: any): Promise<void> {
    const ops: Promise<any>[] = [];
    if (Array.isArray(data?.comments)) {
      for (const c of data.comments as Comment[]) {
        ops.push(this.addComment(c));
      }
    }
    await Promise.all(ops);
  }
}
