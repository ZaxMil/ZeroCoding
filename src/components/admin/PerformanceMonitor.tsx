import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Database,
  Zap,
  TrendingUp
} from 'lucide-react';
import { queryOptimizer } from '@/utils/queryOptimizer';

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState(queryOptimizer.getPerformanceReport());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(queryOptimizer.getPerformanceReport());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const refreshMetrics = () => {
    setIsRefreshing(true);
    setMetrics(queryOptimizer.getPerformanceReport());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const clearMetrics = () => {
    queryOptimizer.clearMetrics();
    setMetrics(queryOptimizer.getPerformanceReport());
  };

  const getPerformanceStatus = () => {
    const avgDuration = parseFloat(metrics.avgDuration);
    if (avgDuration < 100) return { status: 'excellent', color: 'text-green-400', icon: CheckCircle };
    if (avgDuration < 500) return { status: 'good', color: 'text-blue-400', icon: TrendingUp };
    if (avgDuration < 1000) return { status: 'fair', color: 'text-yellow-400', icon: Clock };
    return { status: 'poor', color: 'text-red-400', icon: AlertTriangle };
  };

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Query Performance Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time database query performance metrics and optimization insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshMetrics} disabled={isRefreshing} size="sm" variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={clearMetrics} size="sm" variant="ghost">
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Database className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Database operations tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <StatusIcon className={`h-4 w-4 ${performanceStatus.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDuration}ms</div>
            <p className="text-xs text-muted-foreground">
              Performance: <span className={performanceStatus.color}>{performanceStatus.status}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.slowQueriesCount}</div>
            <p className="text-xs text-muted-foreground">
              Queries &gt; 1000ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorQueriesCount}</div>
            <p className="text-xs text-muted-foreground">
              Failed operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Health Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Query Performance</span>
                <span>{performanceStatus.status}</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (parseFloat(metrics.avgDuration) / 10))} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Error Rate</span>
                <span>{metrics.totalQueries > 0 ? ((metrics.errorQueriesCount / metrics.totalQueries) * 100).toFixed(1) : 0}%</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - ((metrics.errorQueriesCount / Math.max(metrics.totalQueries, 1)) * 100))} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slow Queries Details */}
      {metrics.slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              Recent Slow Queries
            </CardTitle>
            <CardDescription>
              Queries taking longer than 1000ms - consider optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.slowQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">{query.queryName}</span>
                    <p className="text-sm text-muted-foreground">
                      {query.resultCount} results returned
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {query.duration.toFixed(0)}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Queries Details */}
      {metrics.errorQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Recent Query Errors
            </CardTitle>
            <CardDescription>
              Failed database operations requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.errorQueries.map((query, index) => (
                <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{query.queryName}</span>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {query.error}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Query Optimization:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Use count queries instead of selecting all data</li>
                <li>Implement pagination for large datasets</li>
                <li>Add proper database indexes</li>
                <li>Batch related queries with Promise.all</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Performance Best Practices:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Cache frequently accessed data</li>
                <li>Use select() to limit returned columns</li>
                <li>Implement proper error handling</li>
                <li>Monitor and log slow queries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};