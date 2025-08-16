import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEnhancedComments } from '@/hooks/useEnhancedComments';
import { useAuth } from '@/contexts/AuthContext';
import { CommentType, CommentThreadProps } from '@/types/comments';
import { useSimpleRole } from '@/hooks/useSimpleRole';
import { CommentSorting } from './CommentSorting';
import { CommentEditor } from './CommentEditor';
import { ThreadedComment } from './ThreadedComment';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function EnhancedCommentThread({ 
  targetId, 
  targetType, 
  className,
  showSorting = true,
  enableModeration = false,
  maxDepth = 3
}: CommentThreadProps) {
  const { user } = useAuth();
  const { isAdmin, isEditor } = useSimpleRole();
  const { 
    comments, 
    loading, 
    submitting, 
    sortBy, 
    setSortBy,
    submitComment,
    likeComment,
    editComment,
    deleteComment,
    pinComment,
    refreshComments
  } = useEnhancedComments(targetId, targetType);
  
  const [newComment, setNewComment] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const showModerationActions = enableModeration && (isAdmin || isEditor);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    const success = await submitComment({
      content: newComment.trim(),
      target_id: targetId,
      target_type: targetType
    });

    if (success) {
      setNewComment('');
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    const success = await submitComment({
      content: content.trim(),
      parent_id: parentId,
      target_id: targetId,
      target_type: targetType
    });

    return success;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshComments();
    setIsRefreshing(false);
  };

  // Separate pinned and regular comments
  const pinnedComments = comments.filter(comment => comment.is_pinned);
  const regularComments = comments.filter(comment => !comment.is_pinned);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with sorting and refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {showSorting && comments.length > 0 && (
            <CommentSorting
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}
        </div>
      </div>
      
      {/* Comment Form */}
      {user ? (
        <Card>
          <CardContent className="p-4">
            <CommentEditor
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              placeholder="Share your thoughts..."
              submitLabel="Post Comment"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">Please log in to leave a comment</p>
          </CardContent>
        </Card>
      )}

      {/* Pinned Comments */}
      {pinnedComments.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-primary flex items-center gap-2">
            📌 Pinned Comments
          </h4>
          {pinnedComments.map((comment) => (
            <ThreadedComment
              key={comment.id}
              comment={comment}
              targetType={targetType}
              maxDepth={maxDepth}
              onReply={handleReply}
              onLike={likeComment}
              onEdit={async (comment: any) => await editComment(comment.id, comment.content)}
              onDelete={deleteComment}
            />
          ))}
        </div>
      )}

      {/* Regular Comments */}
      <div className="space-y-4">
        {regularComments.map((comment) => (
          <ThreadedComment
            key={comment.id}
            comment={comment}
            targetType={targetType}
            maxDepth={maxDepth}
            onReply={handleReply}
            onLike={likeComment}
            onEdit={async (comment: any) => await editComment(comment.id, comment.content)}
            onDelete={deleteComment}
          />
        ))}
        
        {comments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}