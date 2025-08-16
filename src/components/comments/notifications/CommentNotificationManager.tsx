import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, MessageCircle, Heart, Flag } from 'lucide-react';

interface CommentNotificationManagerProps {
  enabled: boolean;
}

export const CommentNotificationManager: React.FC<CommentNotificationManagerProps> = ({
  enabled
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !user) return;

    // Subscribe to comment notifications
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new;
          
          // Show appropriate notification based on type
          switch (notification.type) {
            case 'reply':
              toast.info('New reply to your comment', {
                icon: <MessageCircle className="h-4 w-4" />,
                action: {
                  label: 'View',
                  onClick: () => {
                    // Navigate to comment thread
                    window.location.hash = `comment-${notification.comment_id}`;
                  }
                }
              });
              break;
              
            case 'like':
              toast.success('Someone liked your comment', {
                icon: <Heart className="h-4 w-4 text-red-500" />,
                duration: 3000
              });
              break;
              
            case 'mention':
              toast.info('You were mentioned in a comment', {
                icon: <Bell className="h-4 w-4" />,
                action: {
                  label: 'View',
                  onClick: () => {
                    window.location.hash = `comment-${notification.comment_id}`;
                  }
                }
              });
              break;
              
            case 'moderation':
              toast.warning('Comment requires moderation', {
                icon: <Flag className="h-4 w-4" />,
                duration: 5000
              });
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, user]);

  return null; // Headless component
};