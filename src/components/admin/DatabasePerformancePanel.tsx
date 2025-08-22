import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { dbPerformanceMonitor, monitoredQuery } from '@/utils/databasePerformanceMonitor';

export const DatabasePerformancePanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [slowQueries, setSlowQueries] = useState<any[]>([]);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const currentStats = dbPerformanceMonitor.getStats();
      const slow = dbPerformanceMonitor.getSlowQueries(500); // Queries > 500ms
      const errors = dbPerformanceMonitor.getRecentErrors(5);
      
      setStats(currentStats);
      setSlowQueries(slow);
      setRecentErrors(errors);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStats();
    
    // Auto-refresh every 30 seconds when monitoring is active
    const interval = setInterval(() => {
      if (isMonitoring) {
        refreshStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      dbPerformanceMonitor.disable();
    } else {
      dbPerformanceMonitor.enable();
    }
    setIsMonitoring(!isMonitoring);
  };

  const clearMetrics = () => {
    dbPerformanceMonitor.clear();
    refreshStats();
  };

  const exportMetrics = () => {
    const metrics = dbPerformanceMonitor.exportMetrics();
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `db-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (avgTime: number) => {
    if (avgTime < 100) return 'text-green-500';
    if (avgTime < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Database Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time database query performance tracking and optimization</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {isMonitoring ? 'Monitoring' : 'Paused'}
          </Badge>
          
          <Button onClick={toggleMonitoring} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            {isMonitoring ? 'Pause' : 'Start'}
          </Button>
          
          <Button onClick={refreshStats} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Query Time</p>
                  <p className={`text-2xl font-semibold ${getPerformanceColor(stats.averageQueryTime)}`}>
                    {formatDuration(stats.averageQueryTime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Queries</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalQueries.toLocaleString()}</p>
                </div>
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className={`text-2xl font-semibold ${stats.errorRate > 5 ? 'text-red-500' : 'text-green-500'}`}>
                    {stats.errorRate.toFixed(1)}%
                  </p>
                </div>
                {stats.errorRate > 5 ? 
                  <AlertTriangle className="h-8 w-8 text-red-500" /> : 
                  <CheckCircle className="h-8 w-8 text-green-500" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Queries/Second</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.queriesPerSecond.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Table Stats</TabsTrigger>
          <TabsTrigger value="slow">Slow Queries</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics and query performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.slowestQuery && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Slowest Query</span>
                      <span className="text-red-500">{formatDuration(stats.slowestQuery.duration)}</span>
                    </div>
                    <Progress value={Math.min((stats.slowestQuery.duration / 2000) * 100, 100)} className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">{stats.slowestQuery.query}</p>
                  </div>
                )}
                
                {stats?.fastestQuery && (
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Fastest Query</span>
                      <span className="text-green-500">{formatDuration(stats.fastestQuery.duration)}</span>
                    </div>
                    <Progress value={(stats.fastestQuery.duration / 100) * 100} className="mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">{stats.fastestQuery.query}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Controls</CardTitle>
                <CardDescription>Manage performance monitoring and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={clearMetrics} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Metrics
                </Button>
                
                <Button onClick={exportMetrics} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                
                <Alert>
                  <AlertDescription>
                    Monitoring tracks the last 1,000 queries with minimal performance impact.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Performance Statistics</CardTitle>
              <CardDescription>Query performance breakdown by database table</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.tableStats && Object.keys(stats.tableStats).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.tableStats).map(([table, tableStats]: [string, any]) => (
                    <div key={table} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{table}</h4>
                        <Badge variant="outline">{tableStats.queryCount} queries</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg Time</p>
                          <p className={`font-medium ${getPerformanceColor(tableStats.averageTime)}`}>
                            {formatDuration(tableStats.averageTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Queries</p>
                          <p className="font-medium">{tableStats.queryCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Errors</p>
                          <p className={`font-medium ${tableStats.errorCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {tableStats.errorCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No table statistics available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Queries</CardTitle>
              <CardDescription>Queries taking longer than 500ms to execute</CardDescription>
            </CardHeader>
            <CardContent>
              {slowQueries.length > 0 ? (
                <div className="space-y-3">
                  {slowQueries.slice(0, 10).map((query, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">{formatDuration(query.duration)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {query.timestamp.toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm font-mono bg-muted p-2 rounded">{query.query}</p>
                      
                      {query.table && (
                        <p className="text-xs text-muted-foreground mt-2">Table: {query.table}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No slow queries detected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>Latest database query errors and failures</CardDescription>
            </CardHeader>
            <CardContent>
              {recentErrors.length > 0 ? (
                <div className="space-y-3">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">Error</Badge>
                        <span className="text-xs text-muted-foreground">
                          {error.timestamp.toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm font-mono bg-muted p-2 rounded mb-2">{error.query}</p>
                      
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error.error}</AlertDescription>
                      </Alert>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent errors</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};