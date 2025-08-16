import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Pin, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { BaseComment, CommentType } from '@/types/comments';
import { useAuth } from '@/contexts/AuthContext';
import { CommentEditor } from './CommentEditor';
import { ReplyIndicator } from './ReplyIndicator';

interface ThreadedCommentProps {
  comment: BaseComment;
  targetType: CommentType;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: string, content: string) => Promise<boolean>;
  onLike?: (commentId: string) => Promise<void>;
  onEdit?: (comment: BaseComment) => Promise<boolean>;
  onDelete?: (commentId: string) => Promise<boolean>;
  className?: string;
}

export function ThreadedComment({
  comment,
  targetType,
  depth = 0,
  maxDepth = 3,
  onReply,
  onLike,
  onEdit,
  onDelete,
  className = ''
}: ThreadedCommentProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const displayName = comment.profile?.display_name || comment.user?.user_metadata?.name || 'Anonymous User';
  const avatarUrl = comment.profile?.avatar_url || comment.user?.user_metadata?.avatar_url;
  const isOwner = user?.id === comment.user_id;
  const canReply = depth < maxDepth && !!user;
  const replyCount = comment.replies?.length || 0;

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;
    
    setIsSubmittingReply(true);
    try {
      const success = await onReply(comment.id, replyContent.trim());
      if (success) {
        setShowReplyForm(false);
        setReplyContent('');
        setShowReplies(true); // Show replies after posting
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLike = async () => {
    if (onLike) {
      await onLike(comment.id);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Card className={`${comment.is_pinned ? 'border-primary/50 bg-primary/5' : ''} ${depth > 0 ? 'ml-6 border-l-2 border-muted' : ''}`}>
        <CardContent className="p-4">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{displayName}</span>
                  
                  {comment.profile?.role === 'admin' && (
                    <Badge variant="destructive" className="text-xs">Admin</Badge>
                  )}
                  
                  {comment.profile?.role === 'moderator' && (
                    <Badge variant="secondary" className="text-xs">Mod</Badge>
                  )}
                  
                  {comment.is_pinned && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Pin className="h-2.5 w-2.5" />
                      Pinned
                    </Badge>
                  )}
                  
                  {comment.is_edited && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {comment.user_level && (
                    <span>• Level {comment.user_level.level}</span>
                  )}
                </div>
              </div>
            </div>

            {isOwner && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Comment Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
            <ReactMarkdown>{comment.content}</ReactMarkdown>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={`h-7 px-2 text-xs ${comment.user_like ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`h-3 w-3 mr-1 ${comment.user_like ? 'fill-current' : ''}`} />
              {comment.like_count || 0}
            </Button>
            
            {canReply && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {replyCount > 0 && (
              <ReplyIndicator
                replyCount={replyCount}
                isCollapsed={!showReplies}
                onToggle={() => setShowReplies(!showReplies)}
              />
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4 pl-4 border-l-2 border-muted">
              <CommentEditor
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                submitLabel="Post Reply"
                showCancel
                placeholder="Write a reply..."
                isSubmitting={isSubmittingReply}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <ThreadedComment
              key={reply.id}
              comment={reply}
              targetType={targetType}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}