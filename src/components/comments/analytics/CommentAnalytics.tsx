import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  ThumbsUp, 
  Users, 
  TrendingUp, 
  Clock,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsData {
  totalComments: number;
  totalLikes: number;
  activeUsers: number;
  avgResponseTime: number;
  sentimentScore: number;
  moderationAlerts: number;
  engagementRate: number;
  commentsPerDay: Array<{ date: string; count: number }>;
  topContributors: Array<{ user: string; comments: number; likes: number }>;
  activityHeatmap: Array<{ hour: number; day: string; activity: number }>;
  contentTypes: Array<{ type: string; count: number; color: string }>;
}

interface CommentAnalyticsProps {
  targetType?: 'series' | 'chapter';
  targetId?: string;
  dateRange?: '7d' | '30d' | '90d' | '1y';
}

export const CommentAnalytics: React.FC<CommentAnalyticsProps> = ({
  targetType,
  targetId,
  dateRange = '30d'
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange);

  useEffect(() => {
    fetchAnalytics();
  }, [targetType, targetId, selectedDateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date filter
      const endDate = new Date();
      const startDate = new Date();
      switch (selectedDateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Build base query
      let tableName = 'comments';
      let targetColumn = '';
      
      if (targetType && targetId) {
        tableName = targetType === 'chapter' ? 'comments' : 'series_comments';
        targetColumn = targetType === 'chapter' ? 'chapter_id' : 'series_id';
      }

      // Fetch basic metrics
      let commentsQuery = supabase
        .from(tableName as any)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'active');

      if (targetType && targetId) {
        commentsQuery = commentsQuery.eq(targetColumn, targetId);
      }

      const { data: comments, error: commentsError } = await commentsQuery;
      if (commentsError) throw commentsError;

      // Fetch likes data
      const { data: likes, error: likesError } = await supabase
        .from('comment_likes')
        .select('*, comments(*)')
        .gte('created_at', startDate.toISOString());

      if (likesError) throw likesError;

      // Process data
      const totalComments = comments?.length || 0;
      const totalLikes = likes?.length || 0;
      const activeUsers = new Set(comments?.map((c: any) => c.user_id)).size;

      // Calculate comments per day
      const commentsPerDay = generateDailyStats(comments || [], startDate, endDate);

      // Get top contributors
      const topContributors = getTopContributors(comments || [], likes || []);

      // Calculate engagement rate
      const engagementRate = totalComments > 0 ? (totalLikes / totalComments) * 100 : 0;

      // Mock data for features not yet fully implemented
      const mockAnalytics: AnalyticsData = {
        totalComments,
        totalLikes,
        activeUsers,
        avgResponseTime: 2.5, // hours
        sentimentScore: 78, // percentage positive
        moderationAlerts: 3,
        engagementRate,
        commentsPerDay,
        topContributors,
        activityHeatmap: generateActivityHeatmap(),
        contentTypes: [
          { type: 'Text', count: totalComments * 0.8, color: '#8884d8' },
          { type: 'Images', count: totalComments * 0.15, color: '#82ca9d' },
          { type: 'Links', count: totalComments * 0.05, color: '#ffc658' },
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyStats = (comments: any[], startDate: Date, endDate: Date) => {
    const stats: { [key: string]: number } = {};
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      stats[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    comments.forEach(comment => {
      const dateStr = new Date(comment.created_at).toISOString().split('T')[0];
      if (stats[dateStr] !== undefined) {
        stats[dateStr]++;
      }
    });

    return Object.entries(stats).map(([date, count]) => ({ date, count }));
  };

  const getTopContributors = (comments: any[], likes: any[]) => {
    const contributors: { [key: string]: { comments: number; likes: number; user: string } } = {};

    comments.forEach(comment => {
      const userId = comment.user_id;
      if (!contributors[userId]) {
        contributors[userId] = {
          user: comment.profiles?.display_name || 'Anonymous',
          comments: 0,
          likes: 0
        };
      }
      contributors[userId].comments++;
    });

      likes.forEach(like => {
        const comment = comments.find(c => c.id === like.comment_id);
        const commentUserId = comment?.user_id;
        if (commentUserId && contributors[commentUserId]) {
          contributors[commentUserId].likes++;
        }
      });

    return Object.values(contributors)
      .sort((a, b) => (b.comments + b.likes) - (a.comments + a.likes))
      .slice(0, 5);
  };

  const generateActivityHeatmap = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmap = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (const day of days) {
        heatmap.push({
          hour,
          day,
          activity: Math.floor(Math.random() * 100)
        });
      }
    }
    
    return heatmap;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center p-8">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comment Analytics</h2>
        <Select value={selectedDateRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setSelectedDateRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalComments}</p>
                <p className="text-sm text-muted-foreground">Total Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalLikes}</p>
                <p className="text-sm text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.activeUsers}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.engagementRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Comments Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.commentsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.contentTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.contentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {analytics.avgResponseTime}h
                  </div>
                  <p className="text-sm text-muted-foreground">Average response time</p>
                  <Progress value={75} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {analytics.sentimentScore}%
                  </div>
                  <p className="text-sm text-muted-foreground">Positive sentiment</p>
                  <Progress value={analytics.sentimentScore} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">
                    {analytics.moderationAlerts}
                  </div>
                  <p className="text-sm text-muted-foreground">Pending alerts</p>
                  <Badge variant="outline" className="mt-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Review needed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <span className="font-medium">{contributor.user}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{contributor.comments} comments</span>
                      <span>{contributor.likes} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced content analysis features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};