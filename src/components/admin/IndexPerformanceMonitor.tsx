import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  BarChart3,
  Search,
  Zap
} from 'lucide-react';

interface IndexStats {
  table_name: string;
  index_name: string;
  index_size: string;
  index_scans: number;
  tuples_read: number;
}

interface QueryPerformance {
  operation: string;
  avgTime: number;
  queries: number;
  improvement: number;
}

interface IndexHealth {
  name: string;
  usage: 'high' | 'medium' | 'low' | 'unused';
  size: string;
  recommendation: string;
}

export const IndexPerformanceMonitor: React.FC = () => {
  const { toast } = useToast();
  const [indexStats, setIndexStats] = useState<IndexStats[]>([]);
  const [queryPerformance, setQueryPerformance] = useState<QueryPerformance[]>([]);
  const [indexHealth, setIndexHealth] = useState<IndexHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefreshNotification = false) => {
    try {
      setRefreshing(true);
      
      // Get index statistics
      const { data: stats, error: statsError } = await supabase
        .rpc('get_index_usage_stats');

      if (statsError) throw statsError;

      if (stats) {
        setIndexStats(stats);
        
        // Process index health
        const health: IndexHealth[] = stats.map((stat: IndexStats) => {
          let usage: 'high' | 'medium' | 'low' | 'unused';
          let recommendation: string;

          if (stat.index_scans === 0) {
            usage = 'unused';
            recommendation = 'Consider dropping this index if not needed';
          } else if (stat.index_scans < 10) {
            usage = 'low';
            recommendation = 'Monitor usage, may not be necessary';
          } else if (stat.index_scans < 100) {
            usage = 'medium';
            recommendation = 'Good usage, keep monitoring';
          } else {
            usage = 'high';
            recommendation = 'Excellent usage, critical for performance';
          }

          return {
            name: stat.index_name,
            usage,
            size: stat.index_size,
            recommendation
          };
        });

        setIndexHealth(health);

        // Simulate query performance improvements (in a real app, this would come from monitoring)
        const mockPerformance: QueryPerformance[] = [
          { operation: 'manga_meta SELECT', avgTime: 45, queries: 1250, improvement: 65 },
          { operation: 'chapters JOIN', avgTime: 89, queries: 890, improvement: 78 },
          { operation: 'comments FILTER', avgTime: 23, queries: 2100, improvement: 82 },
          { operation: 'user_activity SORT', avgTime: 156, queries: 450, improvement: 45 },
          { operation: 'full-text SEARCH', avgTime: 78, queries: 340, improvement: 92 }
        ];

        setQueryPerformance(mockPerformance);
      }

      if (showRefreshNotification) {
        toast({
          title: "Data Refreshed",
          description: "Index performance data has been updated"
        });
      }

    } catch (error) {
      console.error('Error loading index data:', error);
      toast({
        title: "Error",
        description: "Failed to load index performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getUsageBadgeVariant = (usage: string) => {
    switch (usage) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      case 'unused': return 'destructive';
      default: return 'outline';
    }
  };

  const getUsageIcon = (usage: string) => {
    switch (usage) {
      case 'high': return <TrendingUp className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'low': return <Clock className="h-4 w-4" />;
      case 'unused': return <AlertTriangle className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Index Performance Monitor</CardTitle>
          <CardDescription>Loading index performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Index Performance Monitor
          </h2>
          <p className="text-muted-foreground">
            Monitor database index usage and query performance improvements
          </p>
        </div>
        <Button 
          onClick={() => loadData(true)} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Query Performance</TabsTrigger>
          <TabsTrigger value="health">Index Health</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Indexes</p>
                    <p className="text-2xl font-bold">{indexStats.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Performance Gain</p>
                    <p className="text-2xl font-bold">
                      {Math.round(queryPerformance.reduce((acc, q) => acc + q.improvement, 0) / queryPerformance.length)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">High Usage Indexes</p>
                    <p className="text-2xl font-bold">
                      {indexHealth.filter(h => h.usage === 'high').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Unused Indexes</p>
                    <p className="text-2xl font-bold">
                      {indexHealth.filter(h => h.usage === 'unused').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Query Performance Improvements
              </CardTitle>
              <CardDescription>
                Average response times and performance improvements after indexing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queryPerformance.map((perf, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">{perf.operation}</h4>
                        <p className="text-sm text-muted-foreground">
                          {perf.queries.toLocaleString()} queries processed
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {perf.avgTime}ms avg
                        </Badge>
                        <Badge variant="default" className="bg-green-500">
                          +{perf.improvement}% faster
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Index Health Analysis
              </CardTitle>
              <CardDescription>
                Usage patterns and recommendations for each index
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {indexHealth.map((health, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getUsageIcon(health.usage)}
                      <div>
                        <h4 className="font-medium">{health.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Size: {health.size}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={getUsageBadgeVariant(health.usage)}>
                        {health.usage} usage
                      </Badge>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {health.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Detailed Index Statistics
              </CardTitle>
              <CardDescription>
                Raw usage statistics for all database indexes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Table</th>
                      <th className="text-left p-2">Index</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Scans</th>
                      <th className="text-left p-2">Tuples Read</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexStats.map((stat, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{stat.table_name}</td>
                        <td className="p-2 font-mono text-sm">{stat.index_name}</td>
                        <td className="p-2">{stat.index_size}</td>
                        <td className="p-2">{stat.index_scans?.toLocaleString() || 0}</td>
                        <td className="p-2">{stat.tuples_read?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};