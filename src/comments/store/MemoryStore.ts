import { CommentStore } from './CommentStore';
import { Comment, Reaction, Query, XP, Report, Ban, Block } from '@/comments/core/types';

export class MemoryStore implements CommentStore {
  comments = new Map<string, Comment>();
  reactions = new Set<string>();
  xp = new Map<string, XP>();
  reports = new Map<string, Report>();
  bans = new Map<string, Ban>();
  blocks = new Map<string, Block>();

  async addComment(c: Comment) { this.comments.set(c.id, c); }
  async updateComment(c: Comment) { this.comments.set(c.id, c); }
  async getComments(q: Query) {
    const rows = Array.from(this.comments.values()).filter((c) => {
      if (q.scope) {
        const s = q.scope;
        const match = s.type === 'series' ? c.scope.type === 'series' && c.scope.seriesSlug === s.seriesSlug : c.scope.type === 'chapter' && c.scope.seriesSlug === s.seriesSlug && c.scope.chapterNumber === s.chapterNumber;
        if (!match) return false;
      }
      if (typeof q.parentId !== 'undefined' && c.parentId !== q.parentId) return false;
      if (q.userId && c.userId !== q.userId) return false;
      if (q.text && !c.content.toLowerCase().includes(q.text.toLowerCase())) return false;
      return true;
    }).sort((a,b)=>b.createdAt-a.createdAt);
    const total = rows.length;
    const start = q.offset ?? 0;
    const end = (q.offset ?? 0) + (q.limit ?? 20);
    return { rows: rows.slice(start, end), total };
  }
  async addReaction(r: Reaction) {
    const key = `${r.commentId}:${r.userId}:${r.emoji}`;
    if (this.reactions.has(key)) return;
    this.reactions.add(key);
    const c = this.comments.get(r.commentId);
    if (c) {
      c.reactions = c.reactions || ({} as any);
      c.reactions[r.emoji] = (c.reactions[r.emoji] || 0) + 1;
      c.updatedAt = Date.now();
      this.comments.set(c.id, c);
    }
  }
  async removeReaction(r: Reaction) {
    const key = `${r.commentId}:${r.userId}:${r.emoji}`;
    if (!this.reactions.has(key)) return;
    this.reactions.delete(key);
    const c = this.comments.get(r.commentId);
    if (c) {
      c.reactions = c.reactions || ({} as any);
      c.reactions[r.emoji] = Math.max(0, (c.reactions[r.emoji] || 0) - 1);
      c.updatedAt = Date.now();
      this.comments.set(c.id, c);
    }
  }
  async hasReaction(commentId: string, userId: string, emoji: Reaction['emoji']) {
    return this.reactions.has(`${commentId}:${userId}:${emoji}`);
  }
  async getUserXP(userId: string) { return this.xp.get(userId) ?? { userId, xp:0, level:0, updatedAt: Date.now() }; }
  async setUserXP(x: XP) { this.xp.set(x.userId, x); }
  async reportComment(rep: Report) { this.reports.set(rep.id, rep); }
  async setBan(ban: Ban) { this.bans.set(ban.id, ban); }
  async getBans() { return Array.from(this.bans.values()); }
  async setBlock(block: Block) { this.blocks.set(`${block.blockerId}:${block.blockedId}`, block); }
  async getBlocks(blockerId: string) { return Array.from(this.blocks.values()).filter(b=>b.blockerId===blockerId); }
}
