
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CommentType, CommentFormData, BaseComment, CommentSortOption } from '@/types/comments';

export function useEnhancedComments(targetId: string, targetType: CommentType) {
  const { user } = useAuth();
  const [comments, setComments] = useState<BaseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<CommentSortOption['value']>('newest');

  const buildCommentTree = (flatComments: any[]): BaseComment[] => {
    const commentMap = new Map();
    const rootComments: BaseComment[] = [];

    // First pass: create comment objects
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    flatComments.forEach(comment => {
      const commentObj = commentMap.get(comment.id);
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(commentObj);
      } else {
        rootComments.push(commentObj);
      }
    });

    return rootComments;
  };

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
      const targetColumn = targetType === 'chapter' ? 'chapter_id' : 'series_id';

      let query = supabase
        .from(tableName as any)
        .select(`
          *,
          profiles(
            user_id,
            display_name,
            email,
            role,
            is_banned,
            created_at
          ),
          user_levels(
            user_id,
            level,
            current_xp,
            total_xp,
            comments_count,
            likes_received
          ),
          comment_likes(
            user_id,
            is_like
          )
        `)
        .eq(targetColumn, targetId)
        .eq('status', 'active');

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'top':
          query = query.order('like_count', { ascending: false });
          break;
        case 'controversial':
          query = query.order('like_count', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process the data to include user likes
      const processedComments = (data || []).map((comment: any) => {
        const userLike = comment.comment_likes?.find((like: any) => like.user_id === user?.id);
        return {
          ...comment,
          user: {
            id: comment.user_id,
            email: comment.profiles?.email,
            user_metadata: {
              name: comment.profiles?.display_name,
              avatar_url: null
            }
          },
          profile: comment.profiles,
          user_level: comment.user_levels,
          user_like: userLike?.is_like || false
        };
      });

      // Build comment tree for nested replies
      const commentTree = buildCommentTree(processedComments);
      setComments(commentTree);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, sortBy, user?.id]);

  const submitComment = useCallback(async (formData: CommentFormData) => {
    if (!user) {
      toast.error('Please log in to comment');
      return false;
    }

    try {
      setSubmitting(true);
      const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
      
      const commentData: any = {
        user_id: user.id,
        content: formData.content,
        parent_id: formData.parent_id || null,
        status: 'active'
      };

      if (targetType === 'chapter') {
        commentData.chapter_id = formData.target_id;
      } else {
        commentData.series_id = formData.target_id;
      }

      // Optimistic update for immediate display
      const tempComment: BaseComment = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        content: formData.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_id: formData.parent_id || null,
        like_count: 0,
        status: 'active',
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
          }
        },
        profile: {
          user_id: user.id,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: 'member' as const,
          created_at: new Date().toISOString()
        },
        replies: [],
        user_like: false
      };

      // Add optimistic comment immediately
      setComments(prevComments => {
        if (formData.parent_id) {
          // Add as reply to parent comment
          return prevComments.map(comment => {
            if (comment.id === formData.parent_id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), tempComment]
              };
            }
            return comment;
          });
        } else {
          // Add as top-level comment
          return [tempComment, ...prevComments];
        }
      });

      const { error } = await supabase.from(tableName as any).insert([commentData]);
      if (error) throw error;

      toast.success(formData.parent_id ? 'Reply posted successfully!' : 'Comment posted successfully!');
      await fetchComments(); // Refresh to get real data
      return true;
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error(formData.parent_id ? 'Failed to post reply' : 'Failed to post comment');
      
      // Remove optimistic comment on error
      setComments(prevComments => {
        if (formData.parent_id) {
          return prevComments.map(comment => {
            if (comment.id === formData.parent_id) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(reply => !reply.id.startsWith('temp-'))
              };
            }
            return comment;
          });
        } else {
          return prevComments.filter(comment => !comment.id.startsWith('temp-'));
        }
      });
      
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, targetType, fetchComments]);

  const likeComment = useCallback(async (commentId: string) => {
    if (!user) {
      toast.error('Please log in to like comments');
      return;
    }

    try {
      const { error } = await supabase
        .from('comment_likes')
        .upsert([{
          user_id: user.id,
          comment_id: commentId,
          is_like: true
        }], { onConflict: 'user_id,comment_id' });

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  }, [user, fetchComments]);

  const editComment = useCallback(async (commentId: string, content: string) => {
    if (!user) return false;

    try {
      const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
      const { error } = await supabase
        .from(tableName as any)
        .update({ 
          content, 
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Comment updated successfully!');
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to edit comment');
      return false;
    }
  }, [user, targetType, fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return false;

    try {
      const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
      const { error } = await supabase
        .from(tableName as any)
        .update({ status: 'deleted' })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Comment deleted successfully!');
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      return false;
    }
  }, [user, targetType, fetchComments]);

  const pinComment = useCallback(async (commentId: string) => {
    if (!user) return false;

    try {
      const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
      const { error } = await supabase
        .from(tableName as any)
        .update({ 
          is_pinned: true,
          pinned_by: user.id
        })
        .eq('id', commentId);

      if (error) throw error;
      
      toast.success('Comment pinned successfully!');
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error pinning comment:', error);
      toast.error('Failed to pin comment');
      return false;
    }
  }, [user, targetType, fetchComments]);

  // Set up real-time subscriptions
  useEffect(() => {
    const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
    const targetColumn = targetType === 'chapter' ? 'chapter_id' : 'series_id';

    const channel = supabase
      .channel(`comments-${targetType}-${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `${targetColumn}=eq.${targetId}`
        },
        () => {
          fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_likes'
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetId, targetType, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
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
    refreshComments: fetchComments
  };
}
