
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdvancedComments } from '@/hooks/useAdvancedComments';
import { useSeriesChapterInfo } from '@/hooks/useSeriesChapterInfo';
import { useAuth } from '@/contexts/AuthContext';
import { CommentType } from '@/types/comments';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Pin, 
  Reply, 
  Send,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from './editor/RichTextEditor';
import AuthModal from '@/components/AuthModal';

interface UnifiedCommentSystemProps {
  targetId: string;
  targetType: CommentType;
  targetTitle?: string;
  className?: string;
}

interface CommentItemProps {
  comment: any;
  targetType: CommentType;
  onReply: (parentId: string) => void;
  onLike: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onPin: (commentId: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  targetType,
  onReply,
  onLike,
  onEdit,
  onDelete,
  onPin,
  depth = 0
}) => {
  const { user, userProfile } = useAuth();
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = user?.id === comment.user_id;
  // Fix: Check for admin role instead of moderator since moderator doesn't exist in the user_role enum
  const isModerator = userProfile?.role === 'admin';
  const canModerate = isOwner || isModerator;

  const handleEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  const getUserDisplayName = () => {
    return comment.profile?.display_name || comment.user?.user_metadata?.name || comment.user?.email || 'Anonymous';
  };

  const getUserRole = () => {
    const role = comment.profile?.role;
    if (role === 'admin') return 'Admin';
    if (role === 'author') return 'Author';
    if (role === 'editor') return 'Editor';
    return null;
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-3' : 'mb-6'}`}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={comment.user?.user_metadata?.avatar_url} />
        <AvatarFallback>
          {getUserDisplayName().charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{getUserDisplayName()}</span>
          
          {getUserRole() && (
            <Badge variant="secondary" className="text-xs">
              {getUserRole()}
            </Badge>
          )}
          
          {comment.user_level && (
            <Badge variant="outline" className="text-xs">
              Level {comment.user_level.level}
            </Badge>
          )}
          
          {comment.is_pinned && (
            <Badge variant="default" className="text-xs">
              <Pin className="h-3 w-3 mr-1" />
              Pinned
            </Badge>
          )}
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          
          {comment.is_edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(comment.id)}
            className={`gap-1 ${comment.user_like ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 ${comment.user_like ? 'fill-current' : ''}`} />
            {comment.like_count || 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
            className="gap-1"
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>

          {comment.replies?.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="gap-1"
            >
              {showReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Button>
          )}

          {canModerate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isOwner && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isModerator && !comment.is_pinned && (
                  <DropdownMenuItem onClick={() => onPin(comment.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin Comment
                  </DropdownMenuItem>
                )}
                {canModerate && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Replies */}
        {showReplies && comment.replies?.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                targetType={targetType}
                onReply={onReply}
                onLike={onLike}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const UnifiedCommentSystem: React.FC<UnifiedCommentSystemProps> = ({
  targetId,
  targetType,
  targetTitle,
  className
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { series, chapter, loading: infoLoading } = useSeriesChapterInfo(targetId, targetType);

  const {
    comments,
    loading,
    submitting,
    sortBy,
    setSortBy,
    submitComment,
    addReaction,
    removeReaction,
    toggleBookmark,
    reportComment,
    refreshComments,
    editComment,
    deleteComment,
    pinComment
  } = useAdvancedComments(targetId, targetType);

  // Legacy function mapping for compatibility
  const likeComment = async (commentId: string) => {
    await addReaction(commentId, '❤️');
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const success = await submitComment({
      content: newComment.trim(),
      target_id: targetId,
      target_type: targetType,
      parent_id: replyingTo
    });

    if (success) {
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Focus on comment input (you could scroll to it or add a ref)
  };

  // Fix: Handle the setSortBy type properly
  const handleSortChange = (value: string) => {
    setSortBy(value as 'newest' | 'oldest' | 'top' | 'controversial');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {infoLoading ? (
              "Loading..."
            ) : series ? (
              <span className="flex items-center gap-1">
                <Link 
                  to={`/series/${series.id}`}
                  className="text-primary hover:underline"
                >
                  {series.title}
                </Link>
                {chapter && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span>Chapter {chapter.chapter_number}</span>
                    {chapter.title !== `Chapter ${chapter.chapter_number}` && (
                      <>
                        <span className="text-muted-foreground">:</span>
                        <span>{chapter.title}</span>
                      </>
                    )}
                  </>
                )}
              </span>
            ) : (
              targetTitle || `${targetType === 'chapter' ? 'Chapter' : 'Series'} Comments`
            )}
            <Badge variant="outline">{comments.length}</Badge>
          </CardTitle>
          
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="top">Top Liked</SelectItem>
              <SelectItem value="controversial">Controversial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <div className="space-y-3">
            {replyingTo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Reply className="h-4 w-4" />
                Replying to comment
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <RichTextEditor
                  content={newComment}
                  onChange={setNewComment}
                  placeholder={`Write a ${targetType} comment...`}
                  maxLength={2000}
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={submitting || !newComment.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground mb-4">
              Please log in to join the discussion
            </p>
            <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          initialTab="login"
        />

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                targetType={targetType}
                onReply={handleReply}
                onLike={likeComment}
                onEdit={editComment}
                onDelete={deleteComment}
                onPin={pinComment}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
