import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
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
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Clock,
  ThumbsUp,
  Flag
} from 'lucide-react';

interface CommentAnalyticsData {
  totalComments: number;
  activeUsers: number;
  reportsCount: number;
  averageEngagement: number;
  dailyComments: Array<{ date: string; count: number }>;
  topContributors: Array<{ name: string; comments: number; likes: number }>;
  moderationStats: Array<{ status: string; count: number; color: string }>;
}

export const CommentAnalytics: React.FC = () => {
  const [data, setData] = useState<CommentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get comments data for the specified time range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90));

      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          created_at,
          user_id,
          status
        `)
        .gte('created_at', startDate.toISOString());

      const { data: reports } = await supabase
        .from('comment_reports')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      // Process data
      const totalComments = comments?.length || 0;
      const activeUsers = new Set(comments?.map(c => c.user_id)).size;
      const reportsCount = reports?.length || 0;

      // Generate daily comments data
      const dailyComments = generateDailyData(comments || [], timeRange);

      // Generate top contributors
      const topContributors: Array<{ name: string; comments: number; likes: number }> = generateTopContributors(comments || []);

      // Generate moderation stats
      const moderationStats = [
        { status: 'Active', count: comments?.filter(c => c.status === 'active').length || 0, color: '#22c55e' },
        { status: 'Pending', count: comments?.filter(c => c.status === 'pending').length || 0, color: '#f59e0b' },
        { status: 'Deleted', count: comments?.filter(c => c.status === 'deleted').length || 0, color: '#ef4444' },
      ];

      setData({
        totalComments,
        activeUsers,
        reportsCount,
        averageEngagement: totalComments > 0 ? Math.round((activeUsers / totalComments) * 100) : 0,
        dailyComments,
        topContributors,
        moderationStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyData = (comments: any[], range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const dailyData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayComments = comments.filter(c => {
        const commentDate = new Date(c.created_at);
        return commentDate.toDateString() === date.toDateString();
      });
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayComments.length
      });
    }
    
    return dailyData;
  };

  const generateTopContributors = (comments: any[]): Array<{ name: string; comments: number; likes: number }> => {
    const userStats = comments.reduce((acc, comment) => {
      const userId = comment.user_id;
      const userName = `User ${userId.slice(0, 8)}`; // Mock user name
      
      if (!acc[userId]) {
        acc[userId] = { name: userName, comments: 0, likes: 0 };
      }
      
      acc[userId].comments++;
      acc[userId].likes += Math.floor(Math.random() * 10); // Mock likes count
      
      return acc;
    }, {} as Record<string, { name: string; comments: number; likes: number }>);

    return (Object.values(userStats) as Array<{ name: string; comments: number; likes: number }>)
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load analytics data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comment Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="90d">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
              <p className="text-2xl font-bold">{data.totalComments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{data.activeUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Flag className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Reports</p>
              <p className="text-2xl font-bold">{data.reportsCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Engagement %</p>
              <p className="text-2xl font-bold">{data.averageEngagement}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Comments Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Comment Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyComments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Moderation Status */}
        <Card>
          <CardHeader>
            <CardTitle>Moderation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.moderationStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.moderationStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topContributors.map((contributor: { name: string; comments: number; likes: number }, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{contributor.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{contributor.comments} comments</span>
                  <span>{contributor.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};