import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ModernCommentItem } from '../ModernCommentItem';
import { AdvancedComment } from '@/hooks/useAdvancedComments';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  Plus,
  MoreHorizontal,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileOptimizedCommentsProps {
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
  onNewComment: () => void;
  currentUserId?: string;
  showModerationActions?: boolean;
  className?: string;
}

export const MobileOptimizedComments: React.FC<MobileOptimizedCommentsProps> = ({
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
  onNewComment,
  currentUserId,
  showModerationActions,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    
    // Vertical swipe threshold
    const minSwipeDistance = 50;
    
    // Expand/collapse on vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaX) < 100) {
      if (deltaY > 0) {
        // Swipe up - expand
        setIsExpanded(true);
      } else {
        // Swipe down - collapse
        setIsExpanded(false);
      }
    }
  }, [touchStart, touchEnd]);

  // Auto-collapse when scrolling past comments
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isInView && isExpanded && window.innerWidth < 768) {
          setIsExpanded(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded]);

  const displayedComments = isExpanded ? comments : comments.slice(0, 3);

  return (
    <div 
      ref={containerRef}
      className={cn("block md:hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <Card className="sticky top-0 z-20 border-border/30 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Comments</h3>
                <p className="text-xs text-muted-foreground">
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sort/Filter Drawer */}
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Sort & Filter</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-3">
                    {['newest', 'oldest', 'top', 'controversial'].map(sort => (
                      <Button
                        key={sort}
                        variant={sortBy === sort ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => onSortChange(sort)}
                      >
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                      </Button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
              
              {/* Expand/Collapse Toggle */}
              <Button
                variant="outline"
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
          
          {/* Swipe Indicator */}
          <div className="flex justify-center mt-2">
            <div className="w-8 h-1 bg-border rounded-full opacity-50"></div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[70vh]" : "max-h-96"
      )}>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : displayedComments.length === 0 ? (
          <Card className="m-4 p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-medium mb-2">No comments yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share your thoughts!
            </p>
            <Button onClick={onNewComment} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </Card>
        ) : (
          <div className="p-4 space-y-3">
            {displayedComments.map((comment, index) => (
              <MobileCommentCard
                key={comment.id}
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
                isLast={index === displayedComments.length - 1}
              />
            ))}
            
            {/* Show more indicator */}
            {!isExpanded && comments.length > 3 && (
              <Card className="p-4 text-center border-dashed">
                <Button
                  variant="ghost"
                  onClick={() => setIsExpanded(true)}
                  className="w-full"
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View {comments.length - 3} more comment{comments.length - 3 !== 1 ? 's' : ''}
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          onClick={onNewComment}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

// Mobile-optimized comment card component
const MobileCommentCard: React.FC<{
  comment: AdvancedComment;
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
  isGuest: boolean;
  isLast: boolean;
}> = ({
  comment,
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
  isGuest,
  isLast
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card className={cn(
      "p-4 transition-all duration-200",
      !isLast && "border-b-0 rounded-b-none"
    )}>
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {isGuest 
                ? comment.guest_name?.slice(0, 2).toUpperCase()
                : comment.user?.user_metadata?.name?.slice(0, 2).toUpperCase() || '?'
              }
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">
              {isGuest ? comment.guest_name : comment.user?.user_metadata?.name || 'Anonymous'}
            </p>
            <div className="flex items-center gap-2">
              {isGuest && (
                <Badge variant="outline" className="text-xs">Guest</Badge>
              )}
              {comment.profile?.role === 'admin' && (
                <Badge variant="default" className="text-xs">Author</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowActions(!showActions)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        <p className="text-sm leading-relaxed">{comment.content}</p>
      </div>

      {/* Quick Reactions */}
      <div className="flex items-center gap-2 mb-3">
        {['👍', '❤️', '😂'].map(emoji => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            onClick={() => onReaction(comment.id, emoji)}
            className="h-8 px-2 text-sm hover:scale-110 transition-transform"
          >
            {emoji}
          </Button>
        ))}
        <div className="text-xs text-muted-foreground ml-auto">
          {comment.like_count || 0} reactions
        </div>
      </div>

      {/* Action Panel */}
      {showActions && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReply(comment.id)}
          >
            Reply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBookmark(comment.id)}
          >
            {comment.is_bookmarked ? 'Saved' : 'Save'}
          </Button>
        </div>
      )}

      {/* Nested Replies (Simplified for mobile) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 pl-6 border-l-2 border-border/30">
          <p className="text-xs text-muted-foreground mb-2">
            {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
          </p>
          {comment.replies.slice(0, 2).map(reply => (
            <div key={reply.id} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {reply.guest_name || reply.user?.user_metadata?.name || 'Anonymous'}
                </span>
                {reply.profile?.role === 'admin' && (
                  <Badge variant="default" className="text-xs">Author</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{reply.content}</p>
            </div>
          ))}
          {comment.replies.length > 2 && (
            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
              View {comment.replies.length - 2} more replies
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};