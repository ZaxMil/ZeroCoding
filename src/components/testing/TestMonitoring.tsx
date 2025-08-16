import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Monitor,
  Database,
  Globe,
  Users,
  Zap,
  Shield
} from 'lucide-react';

interface TestMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
}

interface TestRun {
  id: string;
  timestamp: Date;
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  environment: string;
}

interface PerformanceMetric {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export const TestMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<TestMetric[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    const sampleMetrics: TestMetric[] = [
      { name: 'Test Pass Rate', value: 94.2, trend: 'up', change: 2.1, unit: '%' },
      { name: 'Code Coverage', value: 87.3, trend: 'up', change: 1.5, unit: '%' },
      { name: 'Build Time', value: 45, trend: 'down', change: -5, unit: 's' },
      { name: 'Deploy Time', value: 120, trend: 'stable', change: 0, unit: 's' },
      { name: 'Error Rate', value: 0.3, trend: 'down', change: -0.1, unit: '%' },
      { name: 'User Satisfaction', value: 4.7, trend: 'up', change: 0.2, unit: '/5' }
    ];

    const sampleTestRuns: TestRun[] = Array.from({ length: 10 }, (_, i) => ({
      id: `run-${i + 1}`,
      timestamp: new Date(Date.now() - (i * 3600000)), // Every hour
      duration: Math.floor(Math.random() * 300) + 180, // 3-8 minutes
      passed: Math.floor(Math.random() * 50) + 45,
      failed: Math.floor(Math.random() * 5),
      skipped: Math.floor(Math.random() * 3),
      coverage: Math.floor(Math.random() * 10) + 85,
      environment: i % 3 === 0 ? 'production' : i % 3 === 1 ? 'staging' : 'development'
    }));

    const samplePerformanceData: PerformanceMetric[] = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (i * 3600000)).toLocaleTimeString(),
      responseTime: Math.floor(Math.random() * 200) + 100,
      throughput: Math.floor(Math.random() * 1000) + 500,
      errorRate: Math.random() * 2,
      cpuUsage: Math.floor(Math.random() * 30) + 40,
      memoryUsage: Math.floor(Math.random() * 20) + 60
    })).reverse();

    setMetrics(sampleMetrics);
    setTestRuns(sampleTestRuns);
    setPerformanceData(samplePerformanceData);
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    // Simulate real-time monitoring
    const interval = setInterval(() => {
      // Update metrics with simulated real-time data
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 2,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable'
      })));
    }, 5000);

    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return '#ef4444';
      case 'staging': return '#f59e0b';
      case 'development': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const pieChartData = [
    { name: 'Passed', value: testRuns[0]?.passed || 0, color: '#22c55e' },
    { name: 'Failed', value: testRuns[0]?.failed || 0, color: '#ef4444' },
    { name: 'Skipped', value: testRuns[0]?.skipped || 0, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Monitoring Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              Test Monitoring Dashboard
              {isMonitoring && (
                <Badge variant="default" className="ml-2 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {isMonitoring ? (
                <Button onClick={stopMonitoring} variant="destructive">
                  Stop Monitoring
                </Button>
              ) : (
                <Button onClick={startMonitoring}>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Monitoring
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">
                      {metric.value.toFixed(1)}{metric.unit}
                    </p>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <p className={`text-sm mt-1 ${
                    metric.change > 0 ? 'text-green-600' : 
                    metric.change < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}{metric.unit} from last run
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Results Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Test Run History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {testRuns.slice(0, 5).map((run) => (
                    <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getEnvironmentColor(run.environment) }}
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {run.environment.charAt(0).toUpperCase() + run.environment.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {run.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge variant={run.failed === 0 ? 'default' : 'destructive'}>
                            {run.passed}/{run.passed + run.failed + run.skipped}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {run.duration}s • {run.coverage}% coverage
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Performance Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics (Last 24 Hours)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#8884d8" 
                        name="Response Time (ms)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="throughput" 
                        stroke="#82ca9d" 
                        name="Throughput (req/s)"
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="errorRate" 
                        stroke="#ff7c7c" 
                        name="Error Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData.slice(-12)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cpuUsage" fill="#8884d8" name="CPU Usage (%)" />
                      <Bar dataKey="memoryUsage" fill="#82ca9d" name="Memory Usage (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="space-y-6">
            {/* Test Coverage Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Test Coverage Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testRuns.reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="coverage" 
                        stroke="#8884d8" 
                        name="Coverage (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Build Duration Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Build Duration Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testRuns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="#82ca9d" 
                        name="Duration (seconds)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            {/* Active Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50 rounded">
                    <div>
                      <p className="font-medium text-red-800">High Error Rate Detected</p>
                      <p className="text-sm text-red-600">Error rate exceeded 5% threshold in production</p>
                      <p className="text-xs text-red-500">2 minutes ago</p>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                    <div>
                      <p className="font-medium text-yellow-800">Slow Response Time</p>
                      <p className="text-sm text-yellow-600">Average response time above 2s threshold</p>
                      <p className="text-xs text-yellow-500">15 minutes ago</p>
                    </div>
                    <Badge variant="secondary">Warning</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium text-blue-800">Test Coverage Drop</p>
                      <p className="text-sm text-blue-600">Coverage decreased by 3% in latest build</p>
                      <p className="text-xs text-blue-500">1 hour ago</p>
                    </div>
                    <Badge variant="outline">Info</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Performance Alerts</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Response Time</span>
                        <span>2000ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate</span>
                        <span>5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPU Usage</span>
                        <span>80%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Quality Alerts</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Test Coverage</span>
                        <span>&lt; 85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed Tests</span>
                        <span>&gt; 3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Build Duration</span>
                        <span>&gt; 600s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};