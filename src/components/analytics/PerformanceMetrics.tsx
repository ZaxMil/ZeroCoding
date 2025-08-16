import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  unit: string;
}

export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcpEntry = lcpEntries[lcpEntries.length - 1];

      const calculateStatus = (value: number, threshold: number): 'good' | 'warning' | 'critical' => {
        if (value <= threshold) return 'good';
        if (value <= threshold * 1.5) return 'warning';
        return 'critical';
      };

      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Page Load Time',
          value: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
          threshold: 3000,
          status: calculateStatus(navigation ? navigation.loadEventEnd - navigation.fetchStart : 0, 3000),
          unit: 'ms'
        },
        {
          name: 'First Contentful Paint',
          value: fcpEntry ? fcpEntry.startTime : 0,
          threshold: 1800,
          status: calculateStatus(fcpEntry ? fcpEntry.startTime : 0, 1800),
          unit: 'ms'
        },
        {
          name: 'Largest Contentful Paint',
          value: lcpEntry ? lcpEntry.startTime : 0,
          threshold: 2500,
          status: calculateStatus(lcpEntry ? lcpEntry.startTime : 0, 2500),
          unit: 'ms'
        },
        {
          name: 'DOM Interactive',
          value: navigation ? navigation.domInteractive - navigation.fetchStart : 0,
          threshold: 2000,
          status: calculateStatus(navigation ? navigation.domInteractive - navigation.fetchStart : 0, 2000),
          unit: 'ms'
        }
      ];

      setMetrics(newMetrics);
      setIsLoading(false);
    };

    // Wait for page to fully load before measuring
    if (document.readyState === 'complete') {
      setTimeout(measurePerformance, 100);
    } else {
      window.addEventListener('load', () => setTimeout(measurePerformance, 100));
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <Clock className="h-4 w-4 text-warning" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-success/20 text-success';
      case 'warning': return 'bg-warning/20 text-warning';
      case 'critical': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {metric.value.toFixed(0)}{metric.unit}
                  </span>
                  <Badge variant="outline" className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={Math.min((metric.value / (metric.threshold * 2)) * 100, 100)}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                Target: &lt; {metric.threshold}{metric.unit}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};