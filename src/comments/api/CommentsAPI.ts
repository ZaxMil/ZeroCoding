import DOMPurify from 'dompurify';
import { CommentStore } from '@/comments/store/CommentStore';
import { IndexedDBStore } from '@/comments/store/IndexedDBStore';
import { bus } from '@/comments/realtime/Bus';
import {
  Comment,
  Scope,
  XP,
  Reaction,
  Attachment,
  makeScopeKey,
  Report,
  Query,
} from '@/comments/core/types';
import { EMOJIS, XP_RULES, computeLevel, containsBadWords, isDuplicate, isTooFast } from '@/comments/core/rules';

const newId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export interface UserRef { id: string; name: string; avatar?: string }

export class CommentsAPI {
  constructor(private store: CommentStore = new IndexedDBStore()) {}

  async getXP(userId: string) {
    return this.store.getUserXP(userId);
  }

  async postComment(scope: Scope, user: UserRef, draft: { content: string; parentId?: string; attachments?: Attachment[] }) {
    const now = Date.now();
    const raw = draft.content || '';
    const sanitized = DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['b','i','em','strong','span','p','br','ul','ol','li','img','a'], ALLOWED_ATTR: ['class','href','src','alt'] });

    // parse [spoiler]...[/spoiler]
    const spoilerRegex = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;
    const hasSpoiler = spoilerRegex.test(sanitized);
    const content = sanitized.replace(spoilerRegex, '<span class="spoiler" data-spoiler="true">$1</span>');

    // Moderation checks
    let status: Comment['status'] = 'active';
    let xpDelta: number = XP_RULES.comment_ok;

    const recentByUser = await this.store.getComments({ scope, userId: user.id, limit: 5, offset: 0 });
    const last = recentByUser.rows[0];
    if (containsBadWords(content)) { status = 'hidden'; xpDelta = XP_RULES.bad_words; }
    else if (isTooFast(last?.createdAt, now)) { status = 'hidden'; xpDelta = XP_RULES.spam_dup; }
    else if (isDuplicate(content, recentByUser.rows.map(c=>c.content))) { status = 'hidden'; xpDelta = XP_RULES.spam_dup; }

    const baseReactions = Object.fromEntries(EMOJIS.map((e)=>[e,0])) as any;

    const c: Comment = {
      id: newId(),
      parentId: draft.parentId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      scope,
      content,
      spoiler: !!hasSpoiler,
      attachments: draft.attachments ?? [],
      reactions: baseReactions,
      createdAt: now,
      updatedAt: now,
      status,
      flags: 0,
    };

    await this.store.addComment(c);

    // XP
    const xp = await this.store.getUserXP(user.id);
    const nextXP: XP = { ...xp, xp: (xp.xp || 0) + xpDelta, level: computeLevel((xp.xp || 0) + xpDelta), updatedAt: now };
    await this.store.setUserXP(nextXP);

    bus.publish({ type: 'comments:changed', payload: { scopeKey: makeScopeKey(scope) } });
    return c;
  }

  async toggleReaction(commentId: string, emoji: typeof EMOJIS[number], userId: string) {
    const exists = await this.store.hasReaction(commentId, userId, emoji);
    const r: Reaction = { commentId, userId, emoji, ts: Date.now() };
    if (exists) {
      await this.store.removeReaction(r);
      bus.publish({ type: 'comments:changed', payload: { commentId } });
      return { removed: true };
    } else {
      await this.store.addReaction(r);
      bus.publish({ type: 'comments:changed', payload: { commentId } });
      return { added: true };
    }
  }

  async uploadImage(file: File): Promise<Attachment> {
    if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      throw new Error('Invalid file (png/jpg/webp/gif, <=5MB)');
    }
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = 512 / Math.max(img.width, img.height);
    const w = Math.round(img.width * Math.min(1, scale));
    const h = Math.round(img.height * Math.min(1, scale));
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b)=>res(b!), 'image/webp', 0.85));
    const url = URL.createObjectURL(blob);

    // thumbnail smaller
    const tw = Math.min(200, w); const th = Math.round((tw / w) * h);
    const tcanvas = document.createElement('canvas'); tcanvas.width = tw; tcanvas.height = th;
    const tctx = tcanvas.getContext('2d')!; tctx.drawImage(canvas, 0, 0, tw, th);
    const tblob = await new Promise<Blob>((res) => tcanvas.toBlob((b)=>res(b!), 'image/webp', 0.8));
    const thumbUrl = URL.createObjectURL(tblob);

    return {
      id: newId(),
      kind: 'image',
      mime: 'image/webp',
      thumbUrl,
      url,
      bytes: blob.size,
      width: w,
      height: h,
    };
  }

  async blockUser(blockerId: string, blockedId: string) {
    await this.store.setBlock({ blockerId, blockedId, createdAt: Date.now() });
    bus.publish({ type: 'comments:moderation' });
  }

  async getBlocks(blockerId: string) {
    return this.store.getBlocks(blockerId);
  }
  
  async queryComments(q: Query) {
    return this.store.getComments(q);
  }

  async banUser(ban: { userId: string; scope: 'global' | 'series' | 'chapter'; scopeKey?: string; expiresAt?: number }) {
    await this.store.setBan({ id: newId(), userId: ban.userId, scope: ban.scope, scopeKey: ban.scopeKey, expiresAt: ban.expiresAt, createdAt: Date.now() });
    bus.publish({ type: 'comments:moderation' });
  }
}
