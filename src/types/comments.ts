export interface CommentUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface UserProfile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  role?: 'admin' | 'moderator' | 'member';
  is_banned?: boolean;
  created_at: string;
}

export interface UserLevel {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  comments_count: number;
  likes_received: number;
}

export interface UserBadge {
  badge_id: string;
  badge_name: string;
  badge_description?: string;
  badge_icon_url?: string;
  badge_color?: string;
  badge_rarity?: string;
  is_premium?: boolean;
  is_animated?: boolean;
  is_equipped?: boolean;
  display_order?: number;
}

export interface BaseComment {
  id: string;
  user_id: string;
  content: string;
  markdown_content?: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  is_edited?: boolean;
  edit_deadline?: string;
  like_count: number;
  is_pinned?: boolean;
  is_flagged?: boolean;
  flag_count?: number;
  status?: 'active' | 'pending_review' | 'deleted';
  pinned_by?: string;
  
  // Guest comment fields
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
  
  // Joined data
  user?: CommentUser;
  profile?: UserProfile;
  user_level?: UserLevel;
  user_badges?: UserBadge[];
  replies?: BaseComment[];
  user_like?: boolean; // Current user's like status
}

export interface ChapterComment extends BaseComment {
  chapter_id: string;
}

export interface SeriesComment extends BaseComment {
  series_id: string;
}

export type CommentType = 'chapter' | 'series';

export interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  is_like: boolean;
  created_at: string;
}

export interface CommentModeration {
  id: string;
  comment_id: string;
  comment_type: CommentType;
  moderator_id?: string;
  action: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CommentFormData {
  content: string;
  parent_id?: string;
  target_id: string; // chapter_id or series_id
  target_type: CommentType;
}

export interface CommentSortOption {
  value: 'newest' | 'oldest' | 'top' | 'controversial';
  label: string;
}

export interface CommentThreadProps {
  targetId: string;
  targetType: CommentType;
  className?: string;
  showSorting?: boolean;
  enableModeration?: boolean;
  maxDepth?: number;
}

export interface CommentItemProps {
  comment: BaseComment;
  targetType: CommentType;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: string, content: string) => Promise<boolean>;
  onEdit?: (comment: BaseComment) => Promise<boolean>;
  onDelete?: (commentId: string) => Promise<boolean>;
  onPin?: (commentId: string) => Promise<boolean>;
  onModerate?: (commentId: string, action: string) => void;
  showModerationActions?: boolean;
}

export interface UserHoverCardProps {
  userId: string;
  trigger: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}