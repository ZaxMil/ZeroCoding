import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Pin, MoreHorizontal, Edit2, Trash2, Flag, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { BaseComment, CommentItemProps } from '@/types/comments';
import { useAuth } from '@/contexts/AuthContext';
import { useSimpleRole } from '@/hooks/useSimpleRole';
import { UserBadge } from './UserBadge';
import { UserHoverCard } from './UserHoverCard';
import { CommentEditor } from './CommentEditor';

export function CommentItem({
  comment,
  targetType,
  depth = 0,
  maxDepth = 3,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onModerate,
  showModerationActions = false
}: CommentItemProps) {
  const { user } = useAuth();
  const { isAdmin, isEditor } = useSimpleRole();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const canEdit = user?.id === comment.user_id || isAdmin;
  const canDelete = user?.id === comment.user_id || isAdmin;
  const canPin = isAdmin || isEditor;
  const canModerate = isAdmin || isEditor;
  const isOwner = user?.id === comment.user_id;

  const displayName = comment.profile?.display_name || comment.user?.user_metadata?.name || 'Anonymous User';
  const avatarUrl = comment.profile?.avatar_url || comment.user?.user_metadata?.avatar_url;

  const handleEdit = () => {
    if (onEdit) {
      onEdit({ ...comment, content: editContent });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(comment.id);
      setShowDeleteDialog(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(comment.id);
      setShowReplyForm(false);
      setReplyContent('');
    }
  };

  const handlePin = () => {
    if (onPin) {
      onPin(comment.id);
    }
  };

  return (
    <Card className={`${comment.is_pinned ? 'border-primary/50 bg-primary/5' : ''} ${depth > 0 ? 'ml-8' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserHoverCard 
                profile={comment.profile} 
                userLevel={comment.user_level}
                trigger={
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>
                      {displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                }
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserHoverCard 
                    profile={comment.profile} 
                    userLevel={comment.user_level}
                    trigger={
                      <span className="font-medium hover:underline cursor-pointer">
                        {displayName}
                      </span>
                    }
                  />
                  
                  <UserBadge 
                    role={comment.profile?.role || 'member'} 
                    level={comment.user_level?.level}
                  />
                  
                  {comment.is_pinned && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Pin className="h-2.5 w-2.5" />
                      Pinned
                    </Badge>
                  )}
                  
                  {comment.is_edited && (
                    <Badge variant="outline" className="text-xs">
                      Edited
                    </Badge>
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

            {/* Actions Menu */}
            {(canEdit || canDelete || canPin || canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  
                  {canPin && (
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="h-4 w-4 mr-2" />
                      {comment.is_pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                  )}
                  
                  {!isOwner && (
                    <DropdownMenuItem>
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}
                  
                  {canModerate && showModerationActions && (
                    <DropdownMenuItem onClick={() => onModerate?.(comment.id, 'pending_review')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Review
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            {isEditing ? (
              <CommentEditor
                value={editContent}
                onChange={setEditContent}
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Update"
                showCancel
                placeholder="Edit your comment..."
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-4 pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-8 px-2 ${comment.user_like ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-3 w-3 mr-1 ${comment.user_like ? 'fill-current' : ''}`} />
                {comment.like_count || 0}
              </Button>
              
              {depth < maxDepth && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4 pl-4 border-l-2 border-muted">
              <CommentEditor
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                submitLabel="Reply"
                showCancel
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3 mt-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  targetType={targetType}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPin={onPin}
                  onModerate={onModerate}
                  showModerationActions={showModerationActions}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}