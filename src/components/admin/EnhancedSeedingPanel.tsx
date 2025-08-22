import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Zap, 
  Shield, 
  Activity,
  Clock,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { runEnhancedSeeding, runOptimizedSeeding, runQuickSeeding } from '@/utils/enhancedSeeding';

interface SeedingStats {
  success: boolean;
  stats: any;
  performance: {
    averageQueryTime: number;
    totalQueries: number;
    errorRate: number;
    totalSeedingTime: number;
    connectionStats: any;
  };
  backupCreated?: string;
  error?: string;
}

export const EnhancedSeedingPanel: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<SeedingStats | null>(null);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [options, setOptions] = useState({
    createBackup: true,
    monitorPerformance: true,
    batchSize: 50
  });
  const { toast } = useToast();

  const simulateProgress = () => {
    setSeedingProgress(0);
    const interval = setInterval(() => {
      setSeedingProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
    return interval;
  };

  const handleSeeding = async (type: 'enhanced' | 'optimized' | 'quick') => {
    setIsSeeding(true);
    setSeedingProgress(0);
    
    const progressInterval = simulateProgress();

    try {
      let result: SeedingStats;
      
      switch (type) {
        case 'optimized':
          result = await runOptimizedSeeding();
          break;
        case 'quick':
          result = await runQuickSeeding();
          break;
        default:
          result = await runEnhancedSeeding(options);
      }

      clearInterval(progressInterval);
      setSeedingProgress(100);
      setLastResult(result);

      if (result.success) {
        toast({
          title: "Seeding Completed",
          description: `Successfully created ${result.stats.seriesCount || 0} series in ${(result.performance.totalSeedingTime / 1000).toFixed(2)}s`,
        });
        
        // Reload page to show new data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "Seeding Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: "Seeding Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, type: 'time' | 'error') => {
    if (type === 'time') {
      if (value < 100) return 'text-green-500';
      if (value < 500) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (value < 1) return 'text-green-500';
      if (value < 5) return 'text-yellow-500';
      return 'text-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Enhanced Database Seeding</h2>
        <p className="text-muted-foreground">Performance-optimized seeding with monitoring and backup</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seeding Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Seeding Configuration
            </CardTitle>
            <CardDescription>Configure seeding options and performance settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-backup">Create Backup Before Seeding</Label>
              <Switch
                id="create-backup"
                checked={options.createBackup}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, createBackup: checked }))}
                disabled={isSeeding}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="monitor-performance">Monitor Performance</Label>
              <Switch
                id="monitor-performance"
                checked={options.monitorPerformance}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, monitorPerformance: checked }))}
                disabled={isSeeding}
              />
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Backup creation is recommended to protect existing data before seeding.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Seeding Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Seeding Actions
            </CardTitle>
            <CardDescription>Choose the seeding method that fits your needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => handleSeeding('optimized')} 
              disabled={isSeeding}
              className="w-full"
              variant="default"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Optimized Seeding
                </>
              )}
            </Button>

            <Button 
              onClick={() => handleSeeding('enhanced')} 
              disabled={isSeeding}
              className="w-full"
              variant="outline"
            >
              <Database className="h-4 w-4 mr-2" />
              Enhanced Seeding
            </Button>

            <Button 
              onClick={() => handleSeeding('quick')} 
              disabled={isSeeding}
              className="w-full"
              variant="outline"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Seeding (Dev)
            </Button>

            {isSeeding && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{seedingProgress.toFixed(0)}%</span>
                </div>
                <Progress value={seedingProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Last Seeding Result
            </CardTitle>
            <CardDescription>
              {lastResult.success ? 'Seeding completed successfully' : 'Seeding failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastResult.success ? (
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                    </div>
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="text-lg font-semibold">{formatTime(lastResult.performance.totalSeedingTime)}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Activity className="h-4 w-4 text-muted-foreground mr-1" />
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Query Time</p>
                    <p className={`text-lg font-semibold ${getPerformanceColor(lastResult.performance.averageQueryTime, 'time')}`}>
                      {formatTime(lastResult.performance.averageQueryTime)}
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Database className="h-4 w-4 text-muted-foreground mr-1" />
                    </div>
                    <p className="text-sm text-muted-foreground">Total Queries</p>
                    <p className="text-lg font-semibold">{lastResult.performance.totalQueries}</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground mr-1" />
                    </div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className={`text-lg font-semibold ${getPerformanceColor(lastResult.performance.errorRate, 'error')}`}>
                      {lastResult.performance.errorRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Data Statistics */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Data Created</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Series: </span>
                      <Badge variant="outline">{lastResult.stats.seriesCount || 0}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Chapters: </span>
                      <Badge variant="outline">{lastResult.stats.chapterCount || 0}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pages: </span>
                      <Badge variant="outline">{lastResult.stats.pageCount || 0}</Badge>
                    </div>
                  </div>
                </div>

                {/* Backup Info */}
                {lastResult.backupCreated && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Backup created before seeding: <code className="font-mono">{lastResult.backupCreated}</code>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {lastResult.error || 'Unknown error occurred during seeding'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};