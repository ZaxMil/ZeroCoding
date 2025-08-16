import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEnhancedComments } from '@/hooks/useEnhancedComments';
import { useAuth } from '@/contexts/AuthContext';
import { CommentType, CommentThreadProps } from '@/types/comments';
import { useSimpleRole } from '@/hooks/useSimpleRole';
import { CommentSorting } from './CommentSorting';
import { CommentEditor } from './CommentEditor';
import { CommentItem } from './CommentItem';

export function CommentThread({ 
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
    pinComment
  } = useEnhancedComments(targetId, targetType);
  
  const [newComment, setNewComment] = useState('');
  
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
    if (!content.trim()) return false;

    const success = await submitComment({
      content: content.trim(),
      parent_id: parentId,
      target_id: targetId,
      target_type: targetType
    });

    return success;
  };

  const handleEdit = async (comment: any) => {
    const success = await editComment(comment.id, comment.content);
    return success;
  };

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(commentId);
    return success;
  };

  const handlePin = async (commentId: string) => {
    const success = await pinComment(commentId);
    return success;
  };

  const handleModerate = async (commentId: string, action: string) => {
    console.log('Moderate:', commentId, action);
    // Implement moderation logic
  };

  // Separate pinned and regular comments
  const pinnedComments = comments.filter(comment => comment.is_pinned);
  const regularComments = comments.filter(comment => !comment.is_pinned);

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with sorting */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        
        {showSorting && comments.length > 0 && (
          <CommentSorting
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}
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
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={targetType}
              maxDepth={maxDepth}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onModerate={handleModerate}
              showModerationActions={showModerationActions}
            />
          ))}
        </div>
      )}

      {/* Regular Comments */}
      <div className="space-y-4">
        {regularComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            targetType={targetType}
            maxDepth={maxDepth}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPin={handlePin}
            onModerate={handleModerate}
            showModerationActions={showModerationActions}
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