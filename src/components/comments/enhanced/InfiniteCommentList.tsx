import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModernCommentItem } from '../ModernCommentItem';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Sparkles,
  Filter,
  Users,
  Crown,
  Pin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteCommentListProps {
  comments: AdvancedComment[];
  loading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReaction: (commentId: string, emoji: string) => void;
  onRemoveReaction: (commentId: string, emoji: string) => void;
  onReply: (parentId: string) => void;
  onEdit: (comment: AdvancedComment) => void;
  onDelete: (commentId: string) => void;
  onPin: (commentId: string) => void;
  onBookmark: (commentId: string) => void;
  onReport: (commentId: string, reason: string, details?: string) => void;
  onLike: (commentId: string) => void;
  currentUserId?: string;
  showModerationActions?: boolean;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'oldest', label: 'Oldest First', icon: Clock },
  { value: 'top', label: 'Most Liked', icon: TrendingUp },
  { value: 'controversial', label: 'Most Discussed', icon: Sparkles },
  { value: 'author-replied', label: 'Author Replied', icon: Crown }
];

export const InfiniteCommentList: React.FC<InfiniteCommentListProps> = ({
  comments,
  loading,
  sortBy,
  onSortChange,
  onReaction,
  onRemoveReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onBookmark,
  onReport,
  onLike,
  currentUserId,
  showModerationActions,
  className
}) => {
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sort and filter comments
  const sortedComments = useMemo(() => {
    const sorted = [...comments].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'top':
          return (b.like_count || 0) - (a.like_count || 0);
        case 'controversial':
          // Sort by reply count + like count for engagement
          const aEngagement = (a.replies?.length || 0) + (a.like_count || 0);
          const bEngagement = (b.replies?.length || 0) + (b.like_count || 0);
          return bEngagement - aEngagement;
        case 'author-replied':
          // Prioritize comments with author replies
          const aHasAuthorReply = a.replies?.some(reply => 
            reply.profile?.role === 'admin' || reply.profile?.role === 'moderator'
          ) ? 1 : 0;
          const bHasAuthorReply = b.replies?.some(reply => 
            reply.profile?.role === 'admin' || reply.profile?.role === 'moderator'
          ) ? 1 : 0;
          return bHasAuthorReply - aHasAuthorReply;
        default:
          return 0;
      }
    });

    // Always show pinned comments first
    return sorted.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [comments, sortBy]);

  const displayedComments = useMemo(() => {
    return sortedComments.slice(0, displayCount);
  }, [sortedComments, displayCount]);

  const hasMore = sortedComments.length > displayCount;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setDisplayCount(prev => prev + 10);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const getCommentStats = useMemo(() => {
    const totalComments = comments.length;
    const totalReplies = comments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0);
    const totalReactions = comments.reduce((sum, comment) => sum + (comment.like_count || 0), 0);
    const uniqueParticipants = new Set([
      ...comments.map(c => c.user_id || c.guest_email),
      ...comments.flatMap(c => c.replies?.map(r => r.user_id || r.guest_email) || [])
    ]).size;

    return { totalComments, totalReplies, totalReactions, uniqueParticipants };
  }, [comments]);

  const selectedSort = SORT_OPTIONS.find(option => option.value === sortBy);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Skeleton loading states */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-12"></div>
                    <div className="h-6 bg-muted rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Header with Stats */}
      <Card className="p-6 bg-gradient-to-r from-background via-background/50 to-background border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">Discussion</h3>
            <Badge variant="secondary" className="text-sm">
              {getCommentStats.totalComments + getCommentStats.totalReplies}
            </Badge>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {selectedSort && <selectedSort.icon className="h-4 w-4" />}
                    {selectedSort?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{getCommentStats.totalComments} comments</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{getCommentStats.uniqueParticipants} participants</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{getCommentStats.totalReactions} reactions</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Active discussion</span>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      {displayedComments.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No comments yet</h3>
          <p className="text-muted-foreground">
            Be the first to share your thoughts and start the discussion!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedComments.map((comment, index) => (
            <div key={comment.id} className="relative">
              {/* Pin indicator for pinned comments */}
              {comment.is_pinned && (
                <div className="absolute -top-2 left-4 z-10">
                  <Badge variant="default" className="text-xs px-2 py-1">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                </div>
              )}
              
              {/* New comment indicator */}
              {index < 3 && (
                <div className="absolute -left-2 top-4 w-1 h-8 bg-primary rounded-full animate-pulse"></div>
              )}
              
              <ModernCommentItem
                comment={comment}
                onReaction={onReaction}
                onRemoveReaction={onRemoveReaction}
                onReply={onReply}
                onBookmark={onBookmark}
                onReport={onReport}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onLike={onLike}
                currentUserId={currentUserId}
                showModerationActions={showModerationActions}
                isGuest={!!comment.guest_name}
              />
            </div>
          ))}
        </div>
      )}

      {/* Load More / Infinite Scroll Indicator */}
      {hasMore && (
        <div className="text-center py-6">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Loading more comments...</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={loadMore}
              className="hover:bg-primary/5"
            >
              Load {Math.min(10, sortedComments.length - displayCount)} more comments
            </Button>
          )}
        </div>
      )}

      {/* End of comments indicator */}
      {!hasMore && displayedComments.length > 0 && (
        <div className="text-center py-6 border-t border-border/30">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>You've reached the end of the discussion</span>
          </div>
        </div>
      )}
    </div>
  );
};