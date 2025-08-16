import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Clock,
  BookOpen,
  Star,
  Calendar,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  userEngagement: Array<{
    date: string;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
  }>;
  contentPopularity: Array<{
    title: string;
    views: number;
    rating: number;
    completionRate: number;
  }>;
  genrePreferences: Array<{
    genre: string;
    percentage: number;
    users: number;
  }>;
  readingPatterns: Array<{
    hour: number;
    activeUsers: number;
    chaptersRead: number;
  }>;
  userRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  deviceStats: Array<{
    device: string;
    users: number;
    percentage: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export const UserBehaviorAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = () => {
      setLoading(true);
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        userEngagement: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          sessions: Math.floor(Math.random() * 5000) + 2000,
          pageViews: Math.floor(Math.random() * 15000) + 8000,
          avgSessionDuration: Math.floor(Math.random() * 600) + 300
        })),
        contentPopularity: [
          { title: 'One Piece', views: 125000, rating: 4.8, completionRate: 85 },
          { title: 'Attack on Titan', views: 98000, rating: 4.9, completionRate: 92 },
          { title: 'Demon Slayer', views: 87000, rating: 4.7, completionRate: 88 },
          { title: 'Naruto', views: 76000, rating: 4.6, completionRate: 78 },
          { title: 'My Hero Academia', views: 65000, rating: 4.5, completionRate: 82 }
        ],
        genrePreferences: [
          { genre: 'Action', percentage: 35, users: 15420 },
          { genre: 'Romance', percentage: 18, users: 7938 },
          { genre: 'Fantasy', percentage: 15, users: 6615 },
          { genre: 'Comedy', percentage: 12, users: 5292 },
          { genre: 'Drama', percentage: 10, users: 4410 },
          { genre: 'Horror', percentage: 10, users: 4410 }
        ],
        readingPatterns: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activeUsers: Math.floor(Math.random() * 2000) + 500,
          chaptersRead: Math.floor(Math.random() * 5000) + 1000
        })),
        userRetention: {
          daily: 72,
          weekly: 58,
          monthly: 42
        },
        deviceStats: [
          { device: 'Mobile', users: 24850, percentage: 65 },
          { device: 'Desktop', users: 11558, percentage: 30 },
          { device: 'Tablet', users: 1927, percentage: 5 }
        ]
      };

      setTimeout(() => {
        setData(mockData);
        setLoading(false);
      }, 1000);
    };

    loadAnalytics();
  }, [timeRange]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-8 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = data.deviceStats.reduce((sum, device) => sum + device.users, 0);
  const totalSessions = data.userEngagement.reduce((sum, day) => sum + day.sessions, 0);
  const avgSessionDuration = data.userEngagement.reduce((sum, day) => sum + day.avgSessionDuration, 0) / data.userEngagement.length;
  const totalPageViews = data.userEngagement.reduce((sum, day) => sum + day.pageViews, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% vs last month
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.2% vs last month
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold">{Math.floor(avgSessionDuration / 60)}m {avgSessionDuration % 60}s</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.1% vs last month
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{(totalPageViews / 1000).toFixed(1)}K</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15.3% vs last month
                </p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.userEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="sessions" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="pageViews" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Daily</span>
                    <Badge variant="outline">{data.userRetention.daily}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weekly</span>
                    <Badge variant="outline">{data.userRetention.weekly}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly</span>
                    <Badge variant="outline">{data.userRetention.monthly}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.contentPopularity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genres" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Genre Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.genrePreferences}
                        dataKey="percentage"
                        nameKey="genre"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ genre, percentage }) => `${genre}: ${percentage}%`}
                      >
                        {data.genrePreferences.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genre Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.genrePreferences.map((genre, index) => (
                    <div key={genre.genre} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{genre.genre}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{genre.users.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{genre.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reading Patterns by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.readingPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(hour) => `${hour}:00`}
                      formatter={(value, name) => [
                        value.toLocaleString(),
                        name === 'activeUsers' ? 'Active Users' : 'Chapters Read'
                      ]}
                    />
                    <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="chaptersRead" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.deviceStats}
                        dataKey="users"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ device, percentage }) => `${device}: ${percentage}%`}
                      >
                        {data.deviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.deviceStats.map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{device.users.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{device.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};