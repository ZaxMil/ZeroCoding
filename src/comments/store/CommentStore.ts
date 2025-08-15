import { Comment, Reaction, Query, XP, Report, Ban, Block } from '@/comments/core/types';

export interface CommentStore {
  addComment(c: Comment): Promise<void>;
  updateComment(c: Comment): Promise<void>;
  getComments(q: Query): Promise<{ rows: Comment[]; total: number }>;

  addReaction(r: Reaction): Promise<void>;
  removeReaction(r: Reaction): Promise<void>;
  hasReaction(commentId: string, userId: string, emoji: Reaction['emoji']): Promise<boolean>;

  getUserXP(userId: string): Promise<XP>;
  setUserXP(x: XP): Promise<void>;

  reportComment(rep: Report): Promise<void>;

  setBan(ban: Ban): Promise<void>;
  getBans(): Promise<Ban[]>;

  setBlock(block: Block): Promise<void>;
  getBlocks(blockerId: string): Promise<Block[]>;

  seed?(data: any): Promise<void>;
}
