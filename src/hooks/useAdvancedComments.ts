import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CommentType, CommentFormData, BaseComment, CommentSortOption } from '@/types/comments';

export interface AdvancedComment extends BaseComment {
  attachments?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }>;
  reactions?: Array<{
    id: string;
    reaction_type: string;
    reaction_value: string;
    user_id: string;
    user?: { id: string; name?: string; avatar?: string };
  }>;
  mentions?: Array<{
    id: string;
    mentioned_user_id: string;
    user?: { id: string; name?: string; avatar?: string };
  }>;
  edit_history?: Array<{
    id: string;
    previous_content: string;
    edit_reason?: string;
    created_at: string;
  }>;
  user_reputation?: {
    reputation_score: number;
    trust_level: number;
  };
  is_bookmarked?: boolean;
  // Guest comment fields
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
}

export function useAdvancedComments(targetId: string, targetType: CommentType) {
  const { user } = useAuth();
  const [comments, setComments] = useState<AdvancedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<CommentSortOption['value']>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'following' | 'mentions' | 'mine'>('all');

  const buildCommentTree = (flatComments: any[]): AdvancedComment[] => {
    const commentMap = new Map();
    const rootComments: AdvancedComment[] = [];

    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

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
          ),
          comment_attachments(
            id,
            file_name,
            file_url,
            file_type,
            file_size
          ),
          comment_reactions(
            id,
            reaction_type,
            reaction_value,
            user_id,
            profiles(display_name)
          ),
          comment_mentions(
            id,
            mentioned_user_id,
            profiles(display_name)
          ),
          user_reputation(
            reputation_score,
            trust_level
          )
        `)
        .eq(targetColumn, targetId)
        .eq('status', 'active');

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      // Apply user filter
      if (filterBy === 'mine' && user) {
        query = query.eq('user_id', user.id);
      } else if (filterBy === 'mentions' && user) {
        // This would need a more complex query with joins
      }

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

      // Process the data
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
          user_like: userLike?.is_like || false,
          attachments: comment.comment_attachments || [],
          reactions: comment.comment_reactions || [],
          mentions: comment.comment_mentions || [],
          user_reputation: comment.user_reputation,
          is_bookmarked: false // Will be fetched separately
        };
      });

      // Check for bookmarks if user is logged in
      if (user && processedComments.length > 0) {
        const commentIds = processedComments.map(c => c.id);
        const { data: bookmarks } = await supabase
          .from('comment_bookmarks')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);
        
        const bookmarkedIds = new Set(bookmarks?.map(b => b.comment_id) || []);
        processedComments.forEach(comment => {
          comment.is_bookmarked = bookmarkedIds.has(comment.id);
        });
      }

      const commentTree = buildCommentTree(processedComments);
      setComments(commentTree);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, sortBy, user?.id, searchQuery, filterBy]);

  const submitComment = useCallback(async (formData: CommentFormData, attachments?: File[]) => {
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

      // Insert the comment and get the ID
      let commentId: string;
      
      if (targetType === 'chapter') {
        const { data, error } = await supabase
          .from('comments')
          .insert([commentData])
          .select('id')
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Failed to create comment');
        commentId = data.id;
      } else {
        const { data, error } = await supabase
          .from('series_comments')
          .insert([commentData])
          .select('id')
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Failed to create comment');
        commentId = data.id;
      }

      // Handle file attachments
      if (attachments && attachments.length > 0) {
        await uploadAttachments(commentId, attachments);
      }

      // Process mentions
      await processMentions(commentId, formData.content);

      toast.success('Comment posted successfully!');
      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to post comment');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, targetType, fetchComments]);

  const uploadAttachments = async (commentId: string, files: File[]) => {
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${commentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comment-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comment-attachments')
        .getPublicUrl(fileName);

      await supabase.from('comment_attachments').insert({
        comment_id: commentId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user!.id
      });
    }
  };

  const processMentions = async (commentId: string, content: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [...content.matchAll(mentionRegex)];
    
    for (const mention of mentions) {
      const username = mention[1];
      
      // Find user by display name
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('display_name', username)
        .limit(1);

      if (profiles && profiles.length > 0) {
        await supabase.from('comment_mentions').insert({
          comment_id: commentId,
          mentioned_user_id: profiles[0].user_id,
          mentioning_user_id: user!.id
        });

        // Create notification
        await supabase.rpc('create_comment_notification', {
          target_user_id: profiles[0].user_id,
          comment_id: commentId,
          notification_type: 'mention',
          triggering_user_id: user!.id
        });
      }
    }
  };

  const addReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!user) {
      toast.error('Please log in to react');
      return;
    }

    try {
      const { error } = await supabase
        .from('comment_reactions')
        .upsert([{
          comment_id: commentId,
          user_id: user.id,
          reaction_type: 'emoji',
          reaction_value: emoji
        }], { 
          onConflict: 'comment_id,user_id,reaction_value',
          ignoreDuplicates: false 
        });

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, [user, fetchComments]);

  const removeReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction_value', emoji);

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast.error('Failed to remove reaction');
    }
  }, [user, fetchComments]);

  const toggleBookmark = useCallback(async (commentId: string) => {
    if (!user) {
      toast.error('Please log in to bookmark');
      return;
    }

    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      if (comment.is_bookmarked) {
        await supabase
          .from('comment_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        await supabase
          .from('comment_bookmarks')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });
      }

      await fetchComments();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  }, [user, comments, fetchComments]);

  const editComment = useCallback(async (commentId: string, content: string) => {
    if (!user) {
      toast.error('Please log in to edit');
      return false;
    }

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
    if (!user) {
      toast.error('Please log in to delete');
      return false;
    }

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
    if (!user) {
      toast.error('Please log in to pin comments');
      return false;
    }

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

  const reportComment = useCallback(async (commentId: string, reason: string, details?: string) => {
    if (!user) {
      toast.error('Please log in to report');
      return;
    }

    try {
      const { error } = await supabase
        .from('comment_reports')
        .insert({
          comment_id: commentId,
          reported_by: user.id,
          report_reason: reason,
          report_details: details
        });

      if (error) throw error;
      toast.success('Report submitted successfully');
    } catch (error) {
      console.error('Error reporting comment:', error);
      toast.error('Failed to submit report');
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
    const targetColumn = targetType === 'chapter' ? 'chapter_id' : 'series_id';

    const channel = supabase
      .channel(`advanced-comments-${targetType}-${targetId}`)
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
          table: 'comment_reactions'
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
          table: 'comment_attachments'
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
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    submitComment,
    editComment,
    deleteComment,
    pinComment,
    addReaction,
    removeReaction,
    toggleBookmark,
    reportComment,
    refreshComments: fetchComments
  };
}