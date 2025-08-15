import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModernCommentItem } from '../ModernCommentItem';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Loader2,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react';

interface VirtualizedCommentListProps {
  comments: AdvancedComment[];
  loading: boolean;
  onReaction: (commentId: string, emoji: string) => void;
  onRemoveReaction: (commentId: string, emoji: string) => void;
  onReply: (parentId: string) => void;
  onBookmark: (commentId: string) => void;
  onReport: (commentId: string, reason: string, details?: string) => void;
  onEdit: (comment: AdvancedComment) => void;
  onDelete: (commentId: string) => void;
  onPin: (commentId: string) => void;
  onLike: (commentId: string) => void;
  currentUserId?: string;
  showModerationActions?: boolean;
  className?: string;
  height?: number;
  itemHeight?: number;
  overscan?: number;
}

interface FlattenedComment extends AdvancedComment {
  depth: number;
  parentId?: string;
  isReply: boolean;
}

// Memoized comment item to prevent unnecessary re-renders
const MemoizedCommentItem = React.memo<{
  comment: FlattenedComment;
  style: React.CSSProperties;
  onReaction: (commentId: string, emoji: string) => void;
  onRemoveReaction: (commentId: string, emoji: string) => void;
  onReply: (parentId: string) => void;
  onBookmark: (commentId: string) => void;
  onReport: (commentId: string, reason: string, details?: string) => void;
  onEdit: (comment: AdvancedComment) => void;
  onDelete: (commentId: string) => void;
  onPin: (commentId: string) => void;
  onLike: (commentId: string) => void;
  currentUserId?: string;
  showModerationActions?: boolean;
}>(({
  comment,
  style,
  onReaction,
  onRemoveReaction,
  onReply,
  onBookmark,
  onReport,
  onEdit,
  onDelete,
  onPin,
  onLike,
  currentUserId,
  showModerationActions
}) => {
  return (
    <div style={style} className={cn("px-4 py-2", comment.isReply && "pl-12")}>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        comment.isReply && "border-l-4 border-primary/30 bg-muted/30"
      )}>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    </div>
  );
});

MemoizedCommentItem.displayName = 'MemoizedCommentItem';

export const VirtualizedCommentList: React.FC<VirtualizedCommentListProps> = ({
  comments,
  loading,
  onReaction,
  onRemoveReaction,
  onReply,
  onBookmark,
  onReport,
  onEdit,
  onDelete,
  onPin,
  onLike,
  currentUserId,
  showModerationActions,
  className,
  height = 600,
  itemHeight = 200,
  overscan = 5
}) => {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const listRef = useRef<VariableSizeList>(null);
  const itemHeightCache = useRef<Map<number, number>>(new Map());

  // Flatten comments for virtualization while preserving threading
  const flattenedComments = useMemo(() => {
    const flattened: FlattenedComment[] = [];
    
    const processComment = (comment: AdvancedComment, depth: number = 0, parentId?: string) => {
      const flatComment: FlattenedComment = {
        ...comment,
        depth,
        parentId,
        isReply: depth > 0
      };
      
      flattened.push(flatComment);
      
      // Add replies if comment is expanded
      if (expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
          processComment(reply, depth + 1, comment.id);
        });
      }
    };

    comments.forEach(comment => processComment(comment));
    return flattened;
  }, [comments, expandedComments]);

  // Dynamic height calculation for variable-sized items
  const getItemHeight = useCallback((index: number) => {
    const cached = itemHeightCache.current.get(index);
    if (cached) return cached;
    
    const comment = flattenedComments[index];
    if (!comment) return itemHeight;
    
    // Base height calculations
    let height = 120; // Base height for avatar, name, date
    
    // Content height (approximate)
    const contentLines = Math.ceil(comment.content.length / 80);
    height += contentLines * 20;
    
    // Additional height for reactions, actions
    height += 60;
    
    // Extra height for pinned/flagged badges
    if (comment.is_pinned || comment.is_flagged) {
      height += 30;
    }
    
    // Reply indentation doesn't affect height much
    // but we add some padding
    if (comment.isReply) {
      height += 10;
    }
    
    // Cap minimum and maximum heights
    height = Math.max(150, Math.min(height, 400));
    
    itemHeightCache.current.set(index, height);
    return height;
  }, [flattenedComments, itemHeight]);

  // Toggle comment expansion
  const toggleCommentExpansion = useCallback((commentId: string) => {
    setExpandedComments(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
      }
      
      // Clear height cache when toggling to recalculate
      itemHeightCache.current.clear();
      
      // Reset list to recalculate heights
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
      
      return newExpanded;
    });
  }, []);

  // Enhanced reply handler that expands parent comment
  const handleReply = useCallback((parentId: string) => {
    // Ensure parent comment is expanded to show the new reply
    setExpandedComments(prev => new Set([...prev, parentId]));
    onReply(parentId);
  }, [onReply]);

  // Item renderer for virtualized list
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const comment = flattenedComments[index];
    if (!comment) return null;

    return (
      <MemoizedCommentItem
        comment={comment}
        style={style}
        onReaction={onReaction}
        onRemoveReaction={onRemoveReaction}
        onReply={handleReply}
        onBookmark={onBookmark}
        onReport={onReport}
        onEdit={onEdit}
        onDelete={onDelete}
        onPin={onPin}
        onLike={onLike}
        currentUserId={currentUserId}
        showModerationActions={showModerationActions}
      />
    );
  }, [
    flattenedComments,
    onReaction,
    onRemoveReaction,
    handleReply,
    onBookmark,
    onReport,
    onEdit,
    onDelete,
    onPin,
    onLike,
    currentUserId,
    showModerationActions
  ]);

  // Performance monitoring
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'comment-render' && entry.duration > 16) {
          console.warn(`Slow comment render: ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (flattenedComments.length === 0) {
    return (
      <Card className={cn("text-center py-12", className)}>
        <CardContent>
          <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No comments yet</h3>
          <p className="text-muted-foreground">
            Be the first to share your thoughts and start the discussion!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Performance Info (Development Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          Rendering {flattenedComments.length} items ({comments.length} root comments) • 
          Virtual height: {height}px • 
          Expanded: {expandedComments.size}
        </div>
      )}

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {flattenedComments.length} comment{flattenedComments.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterCollapsed(!filterCollapsed)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {filterCollapsed ? 'Expand All' : 'Collapse All'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (filterCollapsed) {
                    setExpandedComments(new Set());
                  } else {
                    const allCommentIds = new Set(comments.map(c => c.id));
                    setExpandedComments(allCommentIds);
                  }
                  setFilterCollapsed(!filterCollapsed);
                }}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", filterCollapsed && "rotate-180")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtualized Comment List */}
      <Card>
        <CardContent className="p-0">
          <VariableSizeList
            ref={listRef}
            height={height}
            width="100%"
            itemCount={flattenedComments.length}
            itemSize={getItemHeight}
            overscanCount={overscan}
            itemData={flattenedComments}
            className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            {renderItem}
          </VariableSizeList>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      {flattenedComments.length > 1000 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center mt-0.5">
                <span className="text-xs text-white">!</span>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Large Comment Thread
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This thread has many comments. Consider using filters or collapsing threads to improve performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};