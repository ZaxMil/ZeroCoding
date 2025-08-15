import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Pin, 
  Send,
  MoreVertical,
  Trash2,
  Edit,
  RefreshCcw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { EmojiReactionSystem } from './EmojiReactionSystem';

interface CommentData {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  like_count: number;
  is_pinned: boolean;
  status: string;
  is_edited?: boolean;
  user_profile?: {
    user_id: string;
    display_name?: string;
    email?: string;
    role?: string;
  };
  replies?: CommentData[];
  user_has_liked?: boolean;
}

interface EnhancedCommentSystemProps {
  targetType: 'series' | 'chapter';
  targetId: string;
  targetTitle: string;
  showReactions?: boolean;
  className?: string;
}

export const EnhancedCommentSystem: React.FC<EnhancedCommentSystemProps> = ({ 
  targetType, 
  targetId, 
  targetTitle,
  showReactions = true,
  className = ""
}) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
  const likesTableName = targetType === 'chapter' ? 'comment_likes' : 'series_comment_likes';
  const foreignKeyField = targetType === 'chapter' ? 'chapter_id' : 'series_id';

  const fetchCommentsWithRetry = useCallback(async (attempt = 1) => {
    const maxRetries = 3;
    
    try {
      setLoading(true);
      setError(null);
      
      // Simple query approach to avoid complex joins that might fail
      const { data: commentsData, error: commentsError } = await supabase
        .from(tableName as any)
        .select('*')
        .eq(foreignKeyField, targetId)
        .is('parent_id', null)
        .eq('status', 'active')
        .order(
          sortBy === 'popular' ? 'like_count' : 'created_at', 
          { ascending: sortBy === 'oldest' }
        );

      if (commentsError) throw commentsError;

      if (!commentsData) {
        setComments([]);
        return;
      }

      // Get user IDs for profile lookup
      const userIds = [...new Set((commentsData || []).map((c: any) => c.user_id))];
      
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment: any) => {
          try {
            const { data: repliesData } = await supabase
              .from(tableName as any)
              .select('*')
              .eq('parent_id', comment.id)
              .eq('status', 'active')
              .order('created_at', { ascending: true });

            // Add reply user IDs
            if (repliesData) {
              (repliesData as any[]).forEach((reply: any) => userIds.push(reply.user_id));
            }

            return { ...comment, replies: repliesData || [] };
          } catch (error) {
            console.error('Error fetching replies for comment:', comment.id, error);
            return { ...comment, replies: [] };
          }
        })
      );

      // Fetch user profiles
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name, email, role')
            .in('user_id', [...new Set(userIds)]);

          if (profilesData) {
            profilesMap = (profilesData as any[]).reduce((acc: Record<string, any>, profile: any) => {
              acc[profile.user_id] = profile;
              return acc;
            }, {} as Record<string, any>);
          }
        } catch (profileError) {
          console.error('Error fetching profiles:', profileError);
          // Continue without profiles - use fallback data
        }
      }

      // Check user likes if authenticated
      let likesMap: Record<string, boolean> = {};
      if (user && commentsWithReplies.length > 0) {
        try {
          const allCommentIds = [
            ...commentsWithReplies.map(c => c.id),
            ...commentsWithReplies.flatMap(c => c.replies?.map(r => r.id) || [])
          ];

          if (allCommentIds.length > 0) {
            const { data: likesData } = await supabase
              .from(likesTableName as any)
              .select('comment_id')
              .eq('user_id', user.id)
              .in('comment_id', allCommentIds);

            if (likesData) {
              (likesData as any[]).forEach((like: any) => {
                likesMap[like.comment_id] = true;
              });
            }
          }
        } catch (likesError) {
          console.error('Error fetching likes:', likesError);
          // Continue without likes data
        }
      }

      // Process final comments
      const finalComments = commentsWithReplies.map((comment: any) => ({
        ...comment,
        user_profile: profilesMap[comment.user_id] || {
          user_id: comment.user_id,
          display_name: null,
          email: 'Anonymous User',
          role: 'member'
        },
        replies: (comment.replies || []).map((reply: any) => ({
          ...reply,
          user_profile: profilesMap[reply.user_id] || {
            user_id: reply.user_id,
            display_name: null,
            email: 'Anonymous User',
            role: 'member'
          },
          user_has_liked: likesMap[reply.id] || false
        })),
        user_has_liked: likesMap[comment.id] || false
      }));

      setComments(finalComments);
      setRetryCount(0);
      
    } catch (error) {
      console.error(`Comment fetch attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        setTimeout(() => {
          setRetryCount(attempt);
          fetchCommentsWithRetry(attempt + 1);
        }, delay);
        return;
      }
      
      // Final failure - show error and use fallback
      setError('Failed to load comments. Using cached data if available.');
      loadFromCache();
      
      toast({
        title: "Connection Issue",
        description: "Comments may not be up to date. Check your connection.",
        variant: "destructive"
      });
    } finally {
      if (attempt === 1 || attempt >= 3) {
        setLoading(false);
      }
    }
  }, [targetId, targetType, sortBy, user?.id, tableName, likesTableName, foreignKeyField, toast]);

  const loadFromCache = () => {
    try {
      const cacheKey = `comments_cache_${targetType}_${targetId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedComments = JSON.parse(cached);
        setComments(cachedComments);
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }
  };

  const saveToCache = (commentsData: CommentData[]) => {
    try {
      const cacheKey = `comments_cache_${targetType}_${targetId}`;
      localStorage.setItem(cacheKey, JSON.stringify(commentsData));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  useEffect(() => {
    fetchCommentsWithRetry();
  }, [fetchCommentsWithRetry]);

  useEffect(() => {
    if (comments.length > 0) {
      saveToCache(comments);
    }
  }, [comments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) {
      toast({
        title: "Error",
        description: "Please sign in and enter a comment",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const insertData = {
        content: newComment.trim(),
        user_id: user.id,
        [foreignKeyField]: targetId
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert(insertData);

      if (error) throw error;

      setNewComment('');
      await fetchCommentsWithRetry();
      
      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !user) return;

    try {
      setSubmitting(true);
      
      const replyData = {
        content: replyText.trim(),
        user_id: user.id,
        parent_id: parentId,
        [foreignKeyField]: targetId
      };

      const { error } = await supabase
        .from(tableName as any)
        .insert(replyData);

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      await fetchCommentsWithRetry();
      
      toast({
        title: "Success",
        description: "Reply posted successfully"
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to like comments",
        variant: "destructive"
      });
      return;
    }

    try {
      const comment = comments.find(c => c.id === commentId) || 
                    comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
      if (!comment) return;

      if (comment.user_has_liked) {
        // Unlike
        const { error } = await supabase
          .from(likesTableName as any)
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from(likesTableName as any)
          .insert({
            comment_id: commentId,
            user_id: user.id
          });
        
        if (error) throw error;
      }

      await fetchCommentsWithRetry();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  const renderComment = (comment: CommentData, isReply = false) => (
    <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-8 border-l-2 border-border/30 pl-4' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={`https://avatar.vercel.sh/${comment.user_profile?.display_name || comment.user_profile?.email}`} />
          <AvatarFallback>
            {comment.user_profile?.display_name?.[0] || comment.user_profile?.email?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-medium text-sm">
              {comment.user_profile?.display_name || comment.user_profile?.email?.split('@')[0] || 'Anonymous'}
            </span>
            {comment.user_profile?.role === 'admin' && (
              <Badge variant="destructive" className="text-xs">Admin</Badge>
            )}
            {comment.is_pinned && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Pin className="h-3 w-3" />
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

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm leading-relaxed break-words">{comment.content}</p>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeComment(comment.id)}
              className={`h-8 px-2 text-xs ${
                comment.user_has_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 w-4 mr-1 ${comment.user_has_liked ? 'fill-current' : ''}`} />
              {comment.like_count || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </div>

          {replyingTo === comment.id && (
            <div className="pt-3 space-y-3 border-t border-border/30">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyText.trim() || submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Post Reply
                </Button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="pt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {showReactions && (
        <EmojiReactionSystem
          targetType={targetType}
          targetId={targetId}
          targetTitle={targetTitle}
        />
      )}

      <Card className="border-border/30 bg-card/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments
              {comments.length > 0 && (
                <Badge variant="secondary">{comments.length}</Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCommentsWithRetry()}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </Button>
              )}
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              {error}
              {retryCount > 0 && <span>(Retrying {retryCount}/3)</span>}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {user ? (
            <div className="space-y-3">
              <Textarea
                placeholder={`Share your thoughts about this ${targetType}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Post Comment
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border/50 rounded-lg">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sign in to join the conversation</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="flex space-x-3">
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};