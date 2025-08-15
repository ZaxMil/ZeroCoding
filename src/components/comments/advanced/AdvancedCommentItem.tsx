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
  History,
  Share,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { UserHoverCard } from './UserHoverCard';
import { ReactionPicker } from './ReactionPicker';
import { ReportDialog } from './ReportDialog';
import { EditHistoryDialog } from './EditHistoryDialog';
import { CommentAttachments } from './CommentAttachments';

interface AdvancedCommentItemProps {
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
}

export const AdvancedCommentItem: React.FC<AdvancedCommentItemProps> = ({
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
  currentUserId
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const isOwner = currentUserId === comment.user_id;
  const canModerate = showModerationActions;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isNested = depth > 0;

  const getUserDisplayName = () => {
    return comment.user?.user_metadata?.name || 
           comment.profile?.display_name || 
           comment.user?.email || 
           'Anonymous';
  };

  const getUserRole = () => {
    const role = comment.profile?.role;
    if (role === 'admin') return { label: 'Admin', variant: 'destructive' as const };
    if (role === 'moderator') return { label: 'Moderator', variant: 'secondary' as const };
    return null;
  };

  const getReputationBadge = () => {
    if (!comment.user_reputation) return null;
    
    const { reputation_score, trust_level } = comment.user_reputation;
    if (trust_level >= 4) return { label: 'Trusted', variant: 'secondary' as const };
    if (reputation_score >= 1000) return { label: 'Expert', variant: 'outline' as const };
    if (reputation_score >= 500) return { label: 'Contributor', variant: 'outline' as const };
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
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href + '#comment-' + comment.id);
    }
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn(
        'group relative',
        isNested && 'ml-6 border-l-2 border-border/30 pl-4',
        comment.is_pinned && 'ring-2 ring-primary/20 rounded-lg',
        !isExpanded && 'opacity-50'
      )}
    >
      <Card className={cn(
        'border-border/30 bg-card/20 backdrop-blur-sm transition-all duration-200',
        'hover:bg-card/40 hover:border-border/50',
        comment.is_pinned && 'bg-primary/5 border-primary/30'
      )}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <UserHoverCard userId={comment.user_id}>
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={comment.user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getUserDisplayName().slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </UserHoverCard>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <UserHoverCard userId={comment.user_id}>
                    <span className="font-medium text-sm hover:text-primary cursor-pointer transition-colors">
                      {getUserDisplayName()}
                    </span>
                  </UserHoverCard>

                  {comment.is_pinned && (
                    <Badge variant="outline" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}

                  {getUserRole() && (
                    <Badge variant={getUserRole()!.variant} className="text-xs">
                      {getUserRole()!.label}
                    </Badge>
                  )}

                  {getReputationBadge() && (
                    <Badge variant={getReputationBadge()!.variant} className="text-xs">
                      {getReputationBadge()!.label}
                    </Badge>
                  )}

                  {comment.user_level && comment.user_level.level > 1 && (
                    <Badge variant="outline" className="text-xs">
                      Level {comment.user_level.level}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <time dateTime={comment.created_at}>
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </time>
                  
                  {comment.is_edited && (
                    <>
                      <span>•</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="hover:text-foreground transition-colors">
                            edited
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit History</DialogTitle>
                            <DialogDescription>
                              View the edit history for this comment
                            </DialogDescription>
                          </DialogHeader>
                          <EditHistoryDialog commentId={comment.id} />
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {comment.mentions && comment.mentions.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{comment.mentions.length} mention{comment.mentions.length !== 1 ? 's' : ''}</span>
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
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                
                {comment.edit_history && comment.edit_history.length > 0 && (
                  <DropdownMenuItem>
                    <History className="h-4 w-4 mr-2" />
                    View Edit History
                  </DropdownMenuItem>
                )}

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
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Report Comment</DialogTitle>
                        <DialogDescription>
                          Help us understand what's wrong with this comment
                        </DialogDescription>
                      </DialogHeader>
                      <ReportDialog
                        onSubmit={(reason, details) => onReport?.(comment.id, reason, details)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className={cn('transition-all duration-200', !isExpanded && 'line-clamp-2')}>
            <div 
              className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          </div>

          {/* Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-3">
              <CommentAttachments attachments={comment.attachments} />
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1">
              {/* Like Button */}
              <Button
                variant={comment.user_like ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onLike?.(comment.id)}
                className="gap-1"
              >
                <Heart className={cn('h-4 w-4', comment.user_like && 'fill-current')} />
                {comment.like_count > 0 && (
                  <span className="text-xs">{comment.like_count}</span>
                )}
              </Button>

              {/* Reaction Picker */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  😊
                </Button>
                {showReactions && (
                  <div className="absolute bottom-full left-0 mb-1 z-10">
                    <ReactionPicker
                      onReactionSelect={(emoji) => {
                        onReaction?.(comment.id, emoji);
                        setShowReactions(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Reply Button */}
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply?.(comment.id)}
                  className="gap-1"
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Reactions Display */}
              {formatReactions().map((reaction) => (
                <Button
                  key={reaction.emoji}
                  variant={reaction.hasUserReacted ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (reaction.hasUserReacted) {
                      onRemoveReaction?.(comment.id, reaction.emoji);
                    } else {
                      onReaction?.(comment.id, reaction.emoji);
                    }
                  }}
                  className="gap-1 h-7 px-2"
                  title={`${reaction.count} reaction${reaction.count !== 1 ? 's' : ''}`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs">{reaction.count}</span>
                </Button>
              ))}

              {/* Bookmark Button */}
              <Button
                variant={comment.is_bookmarked ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onBookmark?.(comment.id)}
              >
                <Bookmark className={cn('h-4 w-4', comment.is_bookmarked && 'fill-current')} />
              </Button>

              {/* Collapse/Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Replies */}
      {hasReplies && showReplies && isExpanded && (
        <div className="mt-3 space-y-3">
          {comment.replies!.map((reply) => (
            <AdvancedCommentItem
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
            />
          ))}
        </div>
      )}
    </div>
  );
};