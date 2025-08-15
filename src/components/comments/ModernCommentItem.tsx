import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MoreHorizontal, 
  Reply, 
  Heart, 
  Bookmark, 
  Flag, 
  Edit, 
  Trash2, 
  Pin,
  Share,
  ChevronDown,
  ChevronRight,
  Crown,
  Shield,
  Star,
  Award
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { QuickReactionBar } from './QuickReactionBar';

interface ModernCommentItemProps {
  comment: AdvancedComment;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: string) => void;
  onEdit?: (comment: AdvancedComment) => void;
  onDelete?: (commentId: string) => void;
  onPin?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onReaction?: (commentId: string, emoji: string) => void;
  onRemoveReaction?: (commentId: string, emoji: string) => void;
  onBookmark?: (commentId: string) => void;
  onReport?: (commentId: string, reason: string, details?: string) => void;
  showModerationActions?: boolean;
  currentUserId?: string;
  isGuest?: boolean;
}

export const ModernCommentItem: React.FC<ModernCommentItemProps> = ({
  comment,
  depth = 0,
  maxDepth = 5,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onLike,
  onReaction,
  onRemoveReaction,
  onBookmark,
  onReport,
  showModerationActions = false,
  currentUserId,
  isGuest = false
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const isOwner = currentUserId === comment.user_id;
  const canModerate = showModerationActions;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isNested = depth > 0;

  const getUserDisplayName = () => {
    if (comment.guest_name) return comment.guest_name;
    return comment.user?.user_metadata?.name || 
           comment.profile?.display_name || 
           comment.user?.email || 
           'Anonymous';
  };

  const getUserRole = () => {
    const role = comment.profile?.role;
    if (role === 'admin') return { 
      label: 'Admin', 
      variant: 'destructive' as const, 
      icon: <Crown className="h-3 w-3" />
    };
    if (role === 'moderator') return { 
      label: 'Moderator', 
      variant: 'secondary' as const, 
      icon: <Shield className="h-3 w-3" />
    };
    return null;
  };

  const getReputationBadge = () => {
    if (!comment.user_reputation) return null;
    
    const { reputation_score, trust_level } = comment.user_reputation;
    if (trust_level >= 4) return { 
      label: 'Trusted', 
      variant: 'secondary' as const,
      icon: <Star className="h-3 w-3" />
    };
    if (reputation_score >= 1000) return { 
      label: 'Expert', 
      variant: 'outline' as const,
      icon: <Award className="h-3 w-3" />
    };
    if (reputation_score >= 500) return { 
      label: 'Contributor', 
      variant: 'outline' as const,
      icon: <Star className="h-3 w-3" />
    };
    return null;
  };

  const formatReactions = () => {
    if (!comment.reactions || comment.reactions.length === 0) return [];
    
    const reactionGroups = comment.reactions.reduce((groups, reaction) => {
      const key = reaction.reaction_value;
      if (!groups[key]) {
        groups[key] = {
          emoji: reaction.reaction_value,
          count: 0,
          users: [],
          hasUserReacted: false
        };
      }
      groups[key].count++;
      groups[key].users.push(reaction.user_id);
      if (reaction.user_id === currentUserId) {
        groups[key].hasUserReacted = true;
      }
      return groups;
    }, {} as Record<string, any>);

    return Object.values(reactionGroups);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comment',
          text: comment.content.substring(0, 100) + '...',
          url: window.location.href + '#comment-' + comment.id,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href + '#comment-' + comment.id);
    }
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn(
        'group relative animate-fade-in',
        isNested && 'ml-4 border-l-2 border-primary/20 pl-4 mt-3',
        comment.is_pinned && 'ring-1 ring-primary/30 rounded-lg bg-primary/5',
        !isExpanded && 'opacity-60'
      )}
    >
      <Card className={cn(
        'border-0 bg-transparent shadow-none transition-all duration-200',
        'hover:bg-card/30 hover:shadow-sm rounded-lg p-4',
        comment.is_pinned && 'bg-primary/5',
        isGuest && 'bg-muted/20'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className={cn(
              'h-10 w-10 ring-2 ring-transparent transition-all',
              'hover:ring-primary/20',
              isGuest && 'ring-muted-foreground/20'
            )}>
              <AvatarImage src={comment.user?.user_metadata?.avatar_url} />
              <AvatarFallback className={cn(
                'text-sm font-medium',
                isGuest ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
              )}>
                {getUserDisplayName().slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                  {getUserDisplayName()}
                </span>

                {isGuest && (
                  <Badge variant="outline" className="text-xs">
                    Guest
                  </Badge>
                )}

                {comment.is_pinned && (
                  <Badge variant="secondary" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}

                {getUserRole() && (
                  <Badge variant={getUserRole()!.variant} className="text-xs gap-1">
                    {getUserRole()!.icon}
                    {getUserRole()!.label}
                  </Badge>
                )}

                {getReputationBadge() && (
                  <Badge variant={getReputationBadge()!.variant} className="text-xs gap-1">
                    {getReputationBadge()!.icon}
                    {getReputationBadge()!.label}
                  </Badge>
                )}

                {comment.user_level && comment.user_level.level > 1 && (
                  <Badge variant="outline" className="text-xs">
                    Level {comment.user_level.level}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <time dateTime={comment.created_at} className="hover:text-foreground transition-colors">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </time>
                
                {comment.is_edited && (
                  <>
                    <span>•</span>
                    <span className="text-xs">edited</span>
                  </>
                )}

                {comment.mentions && comment.mentions.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-xs">{comment.mentions.length} mention{comment.mentions.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(comment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {canModerate && !isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onPin?.(comment.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {comment.is_pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </>
              )}

              {!isOwner && (
                <DropdownMenuItem onClick={() => onReport?.(comment.id, 'inappropriate')}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className={cn(
          'transition-all duration-200 mb-4',
          !isExpanded && 'line-clamp-3'
        )}>
          <div 
            className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Like Button */}
            <Button
              variant={comment.user_like ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onLike?.(comment.id)}
              className={cn(
                'gap-1 h-8 px-3 hover:scale-105 transition-all',
                comment.user_like && 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              )}
            >
              <Heart className={cn('h-4 w-4', comment.user_like && 'fill-current')} />
              {comment.like_count > 0 && (
                <span className="text-xs font-medium">{comment.like_count}</span>
              )}
            </Button>

            {/* Quick Reactions */}
            <QuickReactionBar
              commentId={comment.id}
              reactions={formatReactions()}
              onReaction={onReaction!}
              onRemoveReaction={onRemoveReaction!}
            />

            {/* Reply Button */}
            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply?.(comment.id)}
                className="gap-1 h-8 px-3 hover:scale-105 transition-all"
              >
                <Reply className="h-4 w-4" />
                Reply
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Bookmark Button */}
            {!isGuest && (
              <Button
                variant={comment.is_bookmarked ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onBookmark?.(comment.id)}
                className="h-8 w-8 p-0 hover:scale-105 transition-all"
              >
                <Bookmark className={cn('h-4 w-4', comment.is_bookmarked && 'fill-current')} />
              </Button>
            )}

            {/* Collapse/Expand Button */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-8 w-8 p-0 hover:scale-105 transition-all"
              >
                {showReplies ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Replies */}
      {hasReplies && showReplies && isExpanded && (
        <div className="mt-2">
          {comment.replies!.map((reply) => (
            <ModernCommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onLike={onLike}
              onReaction={onReaction}
              onRemoveReaction={onRemoveReaction}
              onBookmark={onBookmark}
              onReport={onReport}
              showModerationActions={showModerationActions}
              currentUserId={currentUserId}
              isGuest={reply.guest_name ? true : false}
            />
          ))}
        </div>
      )}
    </div>
  );
};