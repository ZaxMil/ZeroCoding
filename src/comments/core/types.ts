// Commenting system core types
export type Scope = { type: 'series' | 'chapter'; seriesSlug: string; chapterNumber?: number };

export type Emoji = '👍' | '❤️' | '😂' | '😮' | '😢';

export type CommentStatus = 'active' | 'hidden' | 'deleted';

export interface Attachment {
  id: string;
  kind: 'image';
  mime: string;
  thumbUrl: string; // object URL
  url: string; // object URL
  bytes: number;
  width: number;
  height: number;
}

export interface Comment {
  id: string;
  parentId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  scope: Scope;
  content: string; // sanitized HTML
  spoiler: boolean;
  attachments: Attachment[];
  reactions: Record<Emoji, number>;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  status: CommentStatus;
  flags: number;
}

export interface Reaction {
  commentId: string;
  userId: string;
  emoji: Emoji;
  ts: number;
}

export interface XP {
  userId: string;
  xp: number;
  level: number;
  updatedAt: number;
}

export interface Report {
  id: string;
  commentId: string;
  reporterId: string;
  reason: string;
  ts: number;
  status: 'pending' | 'handled';
}

export interface Ban {
  id: string;
  userId: string;
  scope: 'global' | 'series' | 'chapter';
  scopeKey?: string; // series:<slug> | chapter:<slug>#<num>
  expiresAt?: number;
  createdAt: number;
}

export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: number;
}

export interface Query {
  scope?: Scope;
  parentId?: string;
  userId?: string;
  text?: string;
  since?: number;
  until?: number;
  flagged?: boolean;
  limit?: number;
  offset?: number;
}

export const makeScopeKey = (s: Scope): string =>
  s.type === 'series' ? `series:${s.seriesSlug}` : `chapter:${s.seriesSlug}#${s.chapterNumber}`;
