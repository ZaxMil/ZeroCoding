import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, ThumbsUp, UserPlus, Award, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'comment_reply' | 'comment_like' | 'mention' | 'badge_earned' | 'follow';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  triggering_user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface NotificationSettings {
  comment_replies: boolean;
  comment_likes: boolean;
  mentions: boolean;
  badge_earned: boolean;
  follows: boolean;
  email_notifications: boolean;
}

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    comment_replies: true,
    comment_likes: true,
    mentions: true,
    badge_earned: true,
    follows: true,
    email_notifications: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchNotificationSettings();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Note: notifications table doesn't exist in current schema
      // Using mock data for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'comment_reply',
          title: 'New reply to your comment',
          message: 'Someone replied to your comment on Chapter 1',
          is_read: false,
          created_at: new Date().toISOString(),
          triggering_user: {
            id: '1',
            display_name: 'John Doe'
          }
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      // Note: notification_settings table doesn't exist in current schema
      // Using default settings for now
      console.log('Using default notification settings');
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const subscribeToNotifications = () => {
    // Note: notifications table doesn't exist in current schema
    // Real-time subscriptions would be implemented when the table exists
    console.log('Real-time notifications would be set up here');
    
    return () => {
      console.log('Cleaning up notification subscription');
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Note: notifications table doesn't exist in current schema
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Note: notifications table doesn't exist in current schema
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const updateNotificationSettings = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Note: notification_settings table doesn't exist in current schema
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_reply':
        return <MessageCircle className="w-4 h-4" />;
      case 'comment_like':
        return <ThumbsUp className="w-4 h-4" />;
      case 'mention':
        return <MessageCircle className="w-4 h-4" />;
      case 'badge_earned':
        return <Award className="w-4 h-4" />;
      case 'follow':
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <TabsList className="h-8">
                <TabsTrigger value="notifications" className="text-xs">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="notifications" className="m-0">
            <div className="max-h-96 overflow-y-auto">
              {unreadCount > 0 && (
                <div className="p-3 border-b">
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                </div>
              )}

              {loading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url;
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Comment replies</label>
                <Switch
                  checked={settings.comment_replies}
                  onCheckedChange={(checked) => updateNotificationSettings('comment_replies', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Comment likes</label>
                <Switch
                  checked={settings.comment_likes}
                  onCheckedChange={(checked) => updateNotificationSettings('comment_likes', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mentions</label>
                <Switch
                  checked={settings.mentions}
                  onCheckedChange={(checked) => updateNotificationSettings('mentions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Badge earned</label>
                <Switch
                  checked={settings.badge_earned}
                  onCheckedChange={(checked) => updateNotificationSettings('badge_earned', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">New followers</label>
                <Switch
                  checked={settings.follows}
                  onCheckedChange={(checked) => updateNotificationSettings('follows', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Email notifications</label>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateNotificationSettings('email_notifications', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};