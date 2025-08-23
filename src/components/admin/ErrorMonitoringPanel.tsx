import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  RefreshCw, 
  Download,
  Activity,
  Target,
  Clock,
  Users
} from 'lucide-react';
import { errorRecoverySystem } from '@/utils/errorRecoverySystem';

export const ErrorMonitoringPanel = () => {
  const [errorReport, setErrorReport] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Simulate some loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      const report = errorRecoverySystem.getErrorReport();
      setErrorReport(report);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const exportErrorData = () => {
    if (!errorReport) return;
    
    const dataStr = JSON.stringify(errorReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (!errorReport) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading error monitoring data...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Error Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Advanced error analytics and recovery system dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportErrorData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getHealthColor(errorReport.systemHealth)}`} />
            <span className="font-medium">System Health</span>
          </div>
          <p className="text-2xl font-bold mt-2 capitalize">{errorReport.systemHealth}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-medium">Total Errors</span>
          </div>
          <p className="text-2xl font-bold mt-2">{errorReport.totalErrors}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-red-500" />
            <span className="font-medium">Critical Errors</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-red-500">{errorReport.criticalErrors}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="font-medium">Recovery Rate</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-green-500">
            {errorReport.recoverySuccess.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Error Patterns</h3>
            <div className="space-y-4">
              {errorReport.topErrorPatterns.length > 0 ? (
                errorReport.topErrorPatterns.map((item: any, index: number) => (
                  <div key={item.patternId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.patternId}</span>
                        <Badge variant={getSeverityColor('medium')}>
                          {item.analytics.userImpact} impact
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {item.analytics.errorCount} occurrences
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {item.analytics.frequency.toFixed(2)}/hour
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {item.analytics.resolvedCount} resolved
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">#{index + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(item.analytics.lastOccurrence).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No error patterns detected</p>
                  <p className="text-sm">Your application is running smoothly!</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Error Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Error Distribution</h4>
                <div className="space-y-2">
                  {errorReport.topErrorPatterns.map((item: any) => {
                    const percentage = errorReport.totalErrors > 0 
                      ? (item.analytics.errorCount / errorReport.totalErrors) * 100 
                      : 0;
                    return (
                      <div key={item.patternId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.patternId}</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Recovery Metrics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Success Rate</span>
                    <Badge variant={errorReport.recoverySuccess > 80 ? 'default' : 'destructive'}>
                      {errorReport.recoverySuccess.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical Error Rate</span>
                    <Badge variant={errorReport.criticalErrors === 0 ? 'default' : 'destructive'}>
                      {errorReport.totalErrors > 0 ? 
                        ((errorReport.criticalErrors / errorReport.totalErrors) * 100).toFixed(1) : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Stability</span>
                    <Badge variant={errorReport.systemHealth === 'healthy' ? 'default' : 'secondary'}>
                      {errorReport.systemHealth}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="prevention">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Prevention Recommendations</h3>
            <div className="space-y-4">
              {errorReport.topErrorPatterns.length > 0 ? (
                <div className="space-y-6">
                  {errorReport.topErrorPatterns.slice(0, 3).map((item: any) => (
                    <div key={item.patternId} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{item.patternId}</h4>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          Recommendations to prevent this error pattern:
                        </div>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Implement proper error boundaries around components
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Add retry logic with exponential backoff
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Monitor and validate user inputs
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No prevention recommendations needed</p>
                  <p className="text-sm">Your error handling is working well!</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};