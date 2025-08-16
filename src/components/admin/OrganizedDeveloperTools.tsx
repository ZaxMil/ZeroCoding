import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Code2, 
  Database, 
  RefreshCw, 
  Download, 
  Upload,
  Bug,
  Shield,
  Zap,
  Eye,
  Settings,
  FileText,
  Terminal,
  Globe,
  Server,
  HardDrive,
  Wifi,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { DeveloperToolsPanel } from './DeveloperToolsPanel';
import { DataResetPanel } from './DataResetPanel';
import { useToast } from '@/hooks/use-toast';

interface SystemInfo {
  version: string;
  buildDate: string;
  environment: string;
  nodeVersion: string;
  database: string;
  uptime: string;
}

const mockSystemInfo: SystemInfo = {
  version: '2.1.4',
  buildDate: '2024-01-15 14:30:00',
  environment: 'development',
  nodeVersion: '18.17.0',
  database: 'Supabase',
  uptime: '2 days, 14 hours'
};

interface APIEndpoint {
  name: string;
  url: string;
  method: string;
  status: 'online' | 'offline' | 'slow';
  responseTime: number;
  lastCheck: Date;
}

const mockAPIEndpoints: APIEndpoint[] = [
  { name: 'Series API', url: '/api/series', method: 'GET', status: 'online', responseTime: 120, lastCheck: new Date() },
  { name: 'Chapter API', url: '/api/chapters', method: 'GET', status: 'online', responseTime: 85, lastCheck: new Date() },
  { name: 'User API', url: '/api/users', method: 'GET', status: 'slow', responseTime: 350, lastCheck: new Date() },
  { name: 'Upload API', url: '/api/upload', method: 'POST', status: 'online', responseTime: 200, lastCheck: new Date() },
  { name: 'Comments API', url: '/api/comments', method: 'GET', status: 'offline', responseTime: 0, lastCheck: new Date() }
];

export const OrganizedDeveloperTools: React.FC = () => {
  const { toast } = useToast();
  const [debugMode, setDebugMode] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('');
  const [apiTestUrl, setApiTestUrl] = useState('');
  const [cacheClearing, setCacheClearing] = useState(false);

  const clearCache = async () => {
    setCacheClearing(true);
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCacheClearing(false);
    
    toast({
      title: "Cache Cleared",
      description: "Application cache has been cleared successfully.",
    });
  };

  const runSqlQuery = () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "No Query",
        description: "Please enter a SQL query to execute.",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would execute against the database
    toast({
      title: "Query Executed",
      description: "SQL query has been executed successfully.",
    });
  };

  const testAPI = async () => {
    if (!apiTestUrl.trim()) {
      toast({
        title: "No URL",
        description: "Please enter an API URL to test.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(apiTestUrl);
      toast({
        title: "API Test Result",
        description: `Status: ${response.status} ${response.statusText}`,
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "API Test Failed",
        description: "Failed to connect to the API endpoint.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'slow': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'offline': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Developer Tools</h1>
          <p className="text-slate-400">Development utilities and system diagnostics</p>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          {mockSystemInfo.environment.toUpperCase()}
        </Badge>
      </div>

      {/* System Info Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Globe className="h-6 w-6 mx-auto mb-2 text-blue-400" />
            <p className="text-xs text-slate-400">Version</p>
            <p className="text-sm font-medium text-white">{mockSystemInfo.version}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Server className="h-6 w-6 mx-auto mb-2 text-green-400" />
            <p className="text-xs text-slate-400">Environment</p>
            <p className="text-sm font-medium text-white">{mockSystemInfo.environment}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <HardDrive className="h-6 w-6 mx-auto mb-2 text-purple-400" />
            <p className="text-xs text-slate-400">Database</p>
            <p className="text-sm font-medium text-white">{mockSystemInfo.database}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-xs text-slate-400">Uptime</p>
            <p className="text-sm font-medium text-white">{mockSystemInfo.uptime}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-orange-400" />
            <p className="text-xs text-slate-400">Node.js</p>
            <p className="text-sm font-medium text-white">{mockSystemInfo.nodeVersion}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-xs text-slate-400">Build Date</p>
            <p className="text-sm font-medium text-white">{new Date(mockSystemInfo.buildDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tools" className="space-y-4">
        <TabsList className="bg-slate-900/50 border-slate-800">
          <TabsTrigger value="tools">Development Tools</TabsTrigger>
          <TabsTrigger value="api">API Monitor</TabsTrigger>
          <TabsTrigger value="database">Database Tools</TabsTrigger>
          <TabsTrigger value="data-reset">Data Management</TabsTrigger>
          <TabsTrigger value="settings">Debug Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <DeveloperToolsPanel />
          
          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Common development tasks and utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-slate-800/50 hover:bg-slate-800"
                onClick={clearCache}
                disabled={cacheClearing}
              >
                <RefreshCw className={`h-5 w-5 ${cacheClearing ? 'animate-spin' : ''}`} />
                <span>{cacheClearing ? 'Clearing...' : 'Clear Cache'}</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-slate-800/50 hover:bg-slate-800"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-5 w-5" />
                <span>Reload App</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-slate-800/50 hover:bg-slate-800"
                onClick={() => localStorage.clear()}
              >
                <HardDrive className="h-5 w-5" />
                <span>Clear Storage</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 bg-slate-800/50 hover:bg-slate-800"
                onClick={() => console.clear()}
              >
                <Terminal className="h-5 w-5" />
                <span>Clear Console</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          {/* API Status Monitor */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                API Endpoints Status
              </CardTitle>
              <CardDescription className="text-slate-400">
                Monitor the health of API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAPIEndpoints.map((endpoint) => (
                  <div
                    key={endpoint.url}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(endpoint.status)}>
                        {endpoint.status.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="text-white font-medium">{endpoint.name}</p>
                        <p className="text-sm text-slate-400">
                          {endpoint.method} {endpoint.url}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{endpoint.responseTime}ms</p>
                      <p className="text-xs text-slate-400">
                        {endpoint.lastCheck.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Tester */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">API Tester</CardTitle>
              <CardDescription className="text-slate-400">
                Test API endpoints directly from the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter API URL to test..."
                  value={apiTestUrl}
                  onChange={(e) => setApiTestUrl(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
                <Button onClick={testAPI}>
                  <Zap className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Query Tool
              </CardTitle>
              <CardDescription className="text-slate-400">
                Execute SQL queries directly (Development Only)
              </CardDescription>
              {process.env.NODE_ENV !== 'development' && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Only available in development mode</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter SQL query..."
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="bg-slate-800 border-slate-700 h-32 font-mono text-sm"
                disabled={process.env.NODE_ENV !== 'development'}
              />
              <Button 
                onClick={runSqlQuery}
                disabled={process.env.NODE_ENV !== 'development'}
              >
                <Database className="h-4 w-4 mr-2" />
                Execute Query
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-reset" className="space-y-4">
          <DataResetPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Debug Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure debugging and development options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Debug Mode</Label>
                  <p className="text-sm text-slate-400">Enable detailed console logging</p>
                </div>
                <Switch checked={debugMode} onCheckedChange={setDebugMode} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Performance Monitoring</Label>
                  <p className="text-sm text-slate-400">Track component render times</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Error Boundary Logging</Label>
                  <p className="text-sm text-slate-400">Enhanced error tracking</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Mock Data</Label>
                  <p className="text-sm text-slate-400">Use mock data for development</p>
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