import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle, 
  Bug, 
  Shield, 
  Activity, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  stack?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  resolved: boolean;
  count: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

const mockErrors: ErrorEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    level: 'error',
    message: 'Failed to load chapter images',
    source: 'WebtoonReader.tsx',
    stack: 'TypeError: Cannot read property \'url\' of undefined\n  at WebtoonReader.tsx:45:12\n  at async loadChapter',
    userId: 'user_123',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url: '/reader/series/1/chapter/5',
    resolved: false,
    count: 3
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    level: 'warning',
    message: 'Slow API response time detected',
    source: 'API Gateway',
    userId: 'user_456',
    url: '/api/series/popular',
    resolved: false,
    count: 12
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    level: 'error',
    message: 'Comment submission failed',
    source: 'CommentForm.tsx',
    stack: 'Network Error: Request failed with status 500\n  at submitComment\n  at handleSubmit',
    resolved: true,
    count: 1
  }
];

const mockPerformanceMetrics: PerformanceMetric[] = [
  { name: 'Page Load Time', value: 2.3, unit: 's', status: 'good', trend: 'down' },
  { name: 'Memory Usage', value: 67, unit: '%', status: 'warning', trend: 'up' },
  { name: 'API Response Time', value: 150, unit: 'ms', status: 'good', trend: 'stable' },
  { name: 'Error Rate', value: 0.05, unit: '%', status: 'good', trend: 'down' },
  { name: 'Bundle Size', value: 2.1, unit: 'MB', status: 'critical', trend: 'up' },
  { name: 'Database Queries', value: 45, unit: 'ms', status: 'good', trend: 'stable' }
];

export const ErrorMonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<ErrorEntry[]>(mockErrors);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const filteredErrors = errors.filter(error => {
    const matchesSearch = error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         error.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || error.level === levelFilter;
    const matchesResolved = resolvedFilter === 'all' || 
                           (resolvedFilter === 'resolved' && error.resolved) ||
                           (resolvedFilter === 'unresolved' && !error.resolved);
    
    return matchesSearch && matchesLevel && matchesResolved;
  });

  const errorStats = {
    total: errors.length,
    unresolved: errors.filter(e => !e.resolved).length,
    critical: errors.filter(e => e.level === 'error' && !e.resolved).length,
    warnings: errors.filter(e => e.level === 'warning' && !e.resolved).length
  };

  const toggleErrorResolved = (errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: !error.resolved } : error
    ));
    
    toast({
      title: "Status Updated",
      description: "Error status has been updated successfully.",
    });
  };

  const clearAllErrors = () => {
    if (window.confirm('Are you sure you want to clear all error logs?')) {
      setErrors([]);
      toast({
        title: "Errors Cleared",
        description: "All error logs have been cleared.",
      });
    }
  };

  const exportErrors = () => {
    const dataStr = JSON.stringify(errors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In a real implementation, this would fetch new errors from the API
      console.log('Refreshing error logs...');
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Error Monitoring</h1>
          <p className="text-slate-400">Monitor system errors and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportErrors}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={clearAllErrors}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Error Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Errors</p>
                <p className="text-2xl font-bold text-white">{errorStats.total}</p>
              </div>
              <Bug className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Unresolved</p>
                <p className="text-2xl font-bold text-yellow-400">{errorStats.unresolved}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Critical</p>
                <p className="text-2xl font-bold text-red-400">{errorStats.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Warnings</p>
                <p className="text-2xl font-bold text-orange-400">{errorStats.warnings}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="bg-slate-900/50 border-slate-800">
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search errors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="info">Info</option>
                </select>

                <select
                  value={resolvedFilter}
                  onChange={(e) => setResolvedFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                >
                  <option value="all">All Status</option>
                  <option value="unresolved">Unresolved</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Error List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Error Logs ({filteredErrors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredErrors.map((error) => (
                    <div
                      key={error.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getLevelColor(error.level)}>
                            {error.level.toUpperCase()}
                          </Badge>
                          {error.count > 1 && (
                            <Badge variant="outline" className="text-slate-400">
                              {error.count}x
                            </Badge>
                          )}
                          <span className="text-sm text-slate-400">
                            {error.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {error.resolved ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleErrorResolved(error.id)}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-white font-medium">{error.message}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>Source: {error.source}</span>
                          {error.url && <span>URL: {error.url}</span>}
                          {error.userId && <span>User: {error.userId}</span>}
                        </div>
                        
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-slate-400 hover:text-white">
                              View Stack Trace
                            </summary>
                            <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredErrors.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No errors found matching your filters.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPerformanceMetrics.map((metric) => (
              <Card key={metric.name} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-300">{metric.name}</h3>
                    <div className="flex items-center gap-1">
                      {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-400" />}
                      {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-400" />}
                      {metric.trend === 'stable' && <Activity className="h-4 w-4 text-blue-400" />}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                      {metric.value}
                    </span>
                    <span className="text-sm text-slate-400">{metric.unit}</span>
                  </div>
                  <Badge className={`mt-2 ${getLevelColor(metric.status === 'critical' ? 'error' : metric.status === 'warning' ? 'warning' : 'info')}`}>
                    {metric.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Monitoring Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure error monitoring and alerting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Auto Refresh</Label>
                  <p className="text-sm text-slate-400">Automatically refresh error logs</p>
                </div>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Refresh Interval (seconds)</Label>
                <Input
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  min="5"
                  max="300"
                  disabled={!autoRefresh}
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Email Alerts</Label>
                  <p className="text-sm text-slate-400">Send email notifications for critical errors</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Performance Monitoring</Label>
                  <p className="text-sm text-slate-400">Track performance metrics</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};