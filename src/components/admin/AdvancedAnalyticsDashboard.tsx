import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, TrendingUp, Users, Eye, DollarSign, Activity, Download, RefreshCw } from 'lucide-react';
import { PerformanceMetrics } from '@/components/analytics/PerformanceMetrics';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  conversionRate: number;
  revenue: number;
  topPages: Array<{ page: string; views: number; }>;
  userActivity: Array<{ date: string; users: number; }>;
  deviceBreakdown: Array<{ device: string; percentage: number; }>;
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  const mockAnalyticsData: AnalyticsData = {
    totalUsers: 12547,
    activeUsers: 3421,
    pageViews: 89234,
    conversionRate: 3.2,
    revenue: 45678,
    topPages: [
      { page: '/manga/popular', views: 15234 },
      { page: '/chapters/latest', views: 12456 },
      { page: '/user/dashboard', views: 9876 },
      { page: '/manga/action', views: 8765 },
      { page: '/subscription', views: 6543 }
    ],
    userActivity: [
      { date: '2024-01-01', users: 1200 },
      { date: '2024-01-02', users: 1350 },
      { date: '2024-01-03', users: 1100 },
      { date: '2024-01-04', users: 1450 },
      { date: '2024-01-05', users: 1600 },
      { date: '2024-01-06', users: 1800 },
      { date: '2024-01-07', users: 2100 }
    ],
    deviceBreakdown: [
      { device: 'Mobile', percentage: 65 },
      { device: 'Desktop', percentage: 28 },
      { device: 'Tablet', percentage: 7 }
    ]
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalyticsData(mockAnalyticsData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast({
          title: "Error loading analytics",
          description: "Failed to fetch analytics data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [toast]);

  const refreshData = () => {
    if (isLoading) return;
    
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
      toast({
        title: "Data refreshed",
        description: "Analytics data has been updated."
      });
    }, 1000);
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const csvData = [
      'Metric,Value',
      `Total Users,${analyticsData.totalUsers}`,
      `Active Users,${analyticsData.activeUsers}`,
      `Page Views,${analyticsData.pageViews}`,
      `Conversion Rate,${analyticsData.conversionRate}%`,
      `Revenue,$${analyticsData.revenue}`,
      '',
      'Top Pages,Views',
      ...analyticsData.topPages.map(page => `${page.page},${page.views}`)
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export complete",
      description: "Analytics data has been exported to CSV."
    });
  };

  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportData}
            disabled={!analyticsData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{analyticsData.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{analyticsData.activeUsers.toLocaleString()}</p>
                  <Badge variant="outline" className="mt-1">
                    {((analyticsData.activeUsers / analyticsData.totalUsers) * 100).toFixed(1)}% active
                  </Badge>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                  <p className="text-2xl font-bold">{analyticsData.pageViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">${analyticsData.revenue.toLocaleString()}</p>
                  <Badge variant="outline" className="mt-1">
                    {analyticsData.conversionRate}% conversion
                  </Badge>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Activity Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.userActivity.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${(day.users / 2500) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{day.users}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.deviceBreakdown.map((device) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{device.device}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${device.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm w-12 text-right">{device.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">27.3%</p>
                  <p className="text-sm text-muted-foreground">New Users</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">72.7%</p>
                  <p className="text-sm text-muted-foreground">Returning Users</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">4.2m</p>
                  <p className="text-sm text-muted-foreground">Avg. Session Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Top Performing Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topPages.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{page.page}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(page.views / Math.max(...analyticsData.topPages.map(p => p.views))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {page.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};