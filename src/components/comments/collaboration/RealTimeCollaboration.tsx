import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Eye, Edit, PenTool, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'away';
  current_activity: 'viewing' | 'commenting' | 'editing' | 'moderating';
  last_seen: string;
  cursor_position?: {
    comment_id?: string;
    element: string;
    x: number;
    y: number;
  };
}

interface TypingIndicator {
  user_id: string;
  user_name: string;
  comment_id?: string;
  activity: 'typing_comment' | 'typing_reply' | 'editing_comment';
  started_at: string;
}

interface LiveActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  action: 'joined' | 'left' | 'commented' | 'reacted' | 'moderated' | 'edited';
  details?: string;
  timestamp: string;
}

interface CollaborationMetrics {
  total_online: number;
  active_commenters: number;
  recent_activity_count: number;
  avg_response_time: number;
  peak_concurrent_users: number;
}

interface RealTimeCollaborationProps {
  currentUserId: string;
  onUserActivity?: (activity: LiveActivity) => void;
  className?: string;
}

export const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  currentUserId,
  onUserActivity,
  className = ""
}) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [metrics, setMetrics] = useState<CollaborationMetrics>({
    total_online: 0,
    active_commenters: 0,
    recent_activity_count: 0,
    avg_response_time: 120,
    peak_concurrent_users: 0
  });
  const [isConnected, setIsConnected] = useState(true);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    initializeWebSocket();
    
    // Mock initial data
    loadInitialData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    try {
      // Mock WebSocket connection
      const mockWs = {
        send: (data: string) => console.log('Sending:', data),
        close: () => console.log('WebSocket closed'),
        readyState: 1
      };
      
      wsRef.current = mockWs as any;
      setIsConnected(true);

      // Simulate real-time updates
      const interval = setInterval(() => {
        simulateRealTimeUpdates();
      }, 5000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setIsConnected(false);
    }
  };

  const loadInitialData = () => {
    // Mock online users
    const mockUsers: OnlineUser[] = [
      {
        id: 'user-1',
        name: 'Alice Johnson',
        avatar: '/avatars/alice.jpg',
        status: 'active',
        current_activity: 'commenting',
        last_seen: new Date().toISOString()
      },
      {
        id: 'user-2',
        name: 'Bob Smith',
        avatar: '/avatars/bob.jpg',
        status: 'active',
        current_activity: 'viewing',
        last_seen: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'user-3',
        name: 'Carol Davis',
        avatar: '/avatars/carol.jpg',
        status: 'idle',
        current_activity: 'moderating',
        last_seen: new Date(Date.now() - 600000).toISOString()
      }
    ];

    setOnlineUsers(mockUsers);
    setMetrics({
      total_online: mockUsers.length,
      active_commenters: mockUsers.filter(u => u.current_activity === 'commenting').length,
      recent_activity_count: 15,
      avg_response_time: 120,
      peak_concurrent_users: 8
    });

    // Mock recent activities
    const mockActivities: LiveActivity[] = [
      {
        id: '1',
        user_id: 'user-1',
        user_name: 'Alice Johnson',
        user_avatar: '/avatars/alice.jpg',
        action: 'commented',
        details: 'Added a new comment',
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '2',
        user_id: 'user-2',
        user_name: 'Bob Smith',
        user_avatar: '/avatars/bob.jpg',
        action: 'reacted',
        details: 'Liked a comment',
        timestamp: new Date(Date.now() - 300000).toISOString()
      }
    ];

    setLiveActivities(mockActivities);
  };

  const simulateRealTimeUpdates = () => {
    // Simulate typing indicators
    if (Math.random() > 0.7) {
      const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
      if (randomUser) {
        const newTyping: TypingIndicator = {
          user_id: randomUser.id,
          user_name: randomUser.name,
          activity: 'typing_comment',
          started_at: new Date().toISOString()
        };
        
        setTypingIndicators(prev => [...prev.filter(t => t.user_id !== randomUser.id), newTyping]);
        
        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingIndicators(prev => prev.filter(t => t.user_id !== randomUser.id));
        }, 3000);
      }
    }

    // Simulate user activity
    if (Math.random() > 0.6) {
      const activities = ['joined', 'commented', 'reacted', 'edited'] as const;
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
      
      if (randomUser) {
        const newActivity: LiveActivity = {
          id: Date.now().toString(),
          user_id: randomUser.id,
          user_name: randomUser.name,
          user_avatar: randomUser.avatar,
          action: randomActivity,
          details: getActivityDetails(randomActivity),
          timestamp: new Date().toISOString()
        };

        setLiveActivities(prev => [newActivity, ...prev.slice(0, 9)]);
        onUserActivity?.(newActivity);
      }
    }
  };

  const getActivityDetails = (action: LiveActivity['action']) => {
    const details = {
      joined: 'Joined the discussion',
      left: 'Left the discussion',
      commented: 'Added a new comment',
      reacted: 'Reacted to a comment',
      moderated: 'Moderated content',
      edited: 'Edited a comment'
    };
    return details[action];
  };

  const getStatusColor = (status: OnlineUser['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (activity: OnlineUser['current_activity']) => {
    switch (activity) {
      case 'viewing': return <Eye className="h-3 w-3" />;
      case 'commenting': return <MessageCircle className="h-3 w-3" />;
      case 'editing': return <Edit className="h-3 w-3" />;
      case 'moderating': return <Users className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getActionIcon = (action: LiveActivity['action']) => {
    switch (action) {
      case 'joined': return <Users className="h-3 w-3 text-green-600" />;
      case 'left': return <Users className="h-3 w-3 text-red-600" />;
      case 'commented': return <MessageCircle className="h-3 w-3 text-blue-600" />;
      case 'reacted': return <Badge className="h-3 w-3 text-purple-600" />;
      case 'edited': return <Edit className="h-3 w-3 text-orange-600" />;
      case 'moderated': return <Users className="h-3 w-3 text-indigo-600" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Disconnected</span>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowActivityFeed(!showActivityFeed)}
        >
          Activity Feed
        </Button>
      </div>

      {/* Collaboration Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Live Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.total_online}</div>
              <div className="text-xs text-muted-foreground">Online Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.active_commenters}</div>
              <div className="text-xs text-muted-foreground">Active Commenters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.recent_activity_count}</div>
              <div className="text-xs text-muted-foreground">Recent Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.avg_response_time}s</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
          </div>

          {/* Online Users */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Online Users ({onlineUsers.length})
            </h4>
            <div className="space-y-2">
              {onlineUsers.map(user => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getActivityIcon(user.current_activity)}
                            <span className="capitalize">{user.current_activity.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.status}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {formatDistanceToNow(new Date(user.last_seen))} ago
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Typing Indicators */}
          {typingIndicators.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                Currently Typing
              </h4>
              <div className="space-y-1">
                {typingIndicators.map(indicator => (
                  <div key={indicator.user_id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                    <span>{indicator.user_name} is typing...</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      {showActivityFeed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {liveActivities.map(activity => (
                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user_avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getActionIcon(activity.action)}
                      <span className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>{' '}
                        {activity.details}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp))} ago
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};