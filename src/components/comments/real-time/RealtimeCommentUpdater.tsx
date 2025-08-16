import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CommentType } from '@/types/comments';

interface RealtimeCommentUpdaterProps {
  targetId: string;
  targetType: CommentType;
  onCommentUpdate: () => void;
  onNewComment: (comment: any) => void;
  onCommentDeleted: (commentId: string) => void;
}

export const RealtimeCommentUpdater: React.FC<RealtimeCommentUpdaterProps> = ({
  targetId,
  targetType,
  onCommentUpdate,
  onNewComment,
  onCommentDeleted
}) => {
  useEffect(() => {
    const tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
    const targetColumn = targetType === 'chapter' ? 'chapter_id' : 'series_id';

    // Subscribe to comment changes
    const channel = supabase
      .channel(`realtime-comments-${targetType}-${targetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `${targetColumn}=eq.${targetId}`
        },
        (payload) => {
          const newComment = payload.new;
          onNewComment(newComment);
          toast.success('New comment posted!', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `${targetColumn}=eq.${targetId}`
        },
        (payload) => {
          onCommentUpdate();
          if (payload.new.status === 'deleted') {
            toast.info('Comment was removed', {
              duration: 2000,
              position: 'bottom-right'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: tableName,
          filter: `${targetColumn}=eq.${targetId}`
        },
        (payload) => {
          const deletedCommentId = payload.old.id;
          onCommentDeleted(deletedCommentId);
          toast.info('Comment was deleted', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetId, targetType, onCommentUpdate, onNewComment, onCommentDeleted]);

  return null; // This is a headless component
};