// Enhanced error tracking hook - refactored and modernized version of useErrorTracking
import { useEffect, useCallback } from 'react';
import { errorNotificationManager } from '@/utils/errorNotifications';
import { globalErrorTracker, ErrorTrackingConfig } from '@/utils/errorTrackingCore';
import { errorRecoverySystem } from '@/utils/errorRecoverySystem';

export const useEnhancedErrorTracking = (config: ErrorTrackingConfig = {}) => {
  // Initialize error tracker with config
  useEffect(() => {
    globalErrorTracker.updateConfig(config);
    errorNotificationManager.updateConfig({
      enableToasts: config.enableToasts ?? false,
      enableBrowserNotifications: false,
      maxNotificationsPerHour: 5
    });
  }, [config]);

  // Track JavaScript errors with enhanced recovery
  const trackError = useCallback((
    message: string,
    source?: string,
    stack?: string,
    level: 'error' | 'warning' | 'info' = 'error'
  ) => {
    // Track with core tracker
    const errorDetails = globalErrorTracker.trackError(message, source, stack, level);
    
    // Show notifications
    if (level === 'error') {
      errorNotificationManager.notifyError(message, level);
    }

    // Analyze with recovery system
    const error = new Error(message);
    if (stack) error.stack = stack;
    
    const analysis = errorRecoverySystem.analyzeError(error);
    
    return {
      errorDetails,
      analysis,
      canRecover: !!analysis.recoveryAction,
      suggestions: analysis.preventionSuggestions
    };
  }, []);

  // Track React component errors with enhanced context
  const trackComponentError = useCallback((
    error: Error,
    errorInfo: { componentStack?: string },
    source?: string
  ) => {
    const fullStack = error.stack + 
      (errorInfo.componentStack ? `\n\nComponent Stack:${errorInfo.componentStack}` : '');
    
    return trackError(
      error.message,
      source || 'React Component',
      fullStack,
      'error'
    );
  }, [trackError]);

  // Track network errors with smart retry suggestions
  const trackNetworkError = useCallback((
    url: string,
    status: number,
    statusText: string,
    responseText?: string
  ) => {
    const context = {
      url,
      status,
      statusText,
      responseText,
      retryFunction: async () => {
        // Placeholder for retry logic
        return false;
      }
    };

    const error = new Error(`Network error: ${status} ${statusText}`);
    const analysis = errorRecoverySystem.analyzeError(error, context);

    return trackError(
      `Network error: ${status} ${statusText}`,
      'Network Request',
      `URL: ${url}\nStatus: ${status} ${statusText}\nResponse: ${responseText || 'No response body'}`,
      status >= 500 ? 'error' : 'warning'
    );
  }, [trackError]);

  // Track performance issues with intelligent thresholds
  const trackPerformanceIssue = useCallback((
    metricName: string,
    value: number,
    threshold: number,
    unit: string = 'ms'
  ) => {
    if (value > threshold) {
      return trackError(
        `Performance issue: ${metricName} (${value}${unit}) exceeded threshold (${threshold}${unit})`,
        'Performance Monitor',
        `Metric: ${metricName}\nValue: ${value}${unit}\nThreshold: ${threshold}${unit}`,
        'warning'
      );
    }
    return null;
  }, [trackError]);

  // Get comprehensive error analytics
  const getErrorAnalytics = useCallback(() => {
    const coreStats = globalErrorTracker.getErrorStats();
    const recoveryReport = errorRecoverySystem.getErrorReport();
    const notificationStats = errorNotificationManager.getStats();

    return {
      core: coreStats,
      recovery: recoveryReport,
      notifications: notificationStats,
      combined: {
        totalIssues: coreStats.totalErrors + recoveryReport.totalErrors,
        criticalIssues: (coreStats.errorsByLevel.error || 0) + recoveryReport.criticalErrors,
        systemHealth: recoveryReport.systemHealth,
        recoveryRate: recoveryReport.recoverySuccess
      }
    };
  }, []);

  // Set up global error handlers with enhanced recovery
  useEffect(() => {
    // JavaScript runtime errors
    const handleError = (event: ErrorEvent) => {
      trackError(
        event.message,
        event.filename,
        `Line: ${event.lineno}, Column: ${event.colno}\n${event.error?.stack || 'No stack trace'}`,
        'error'
      );
    };

    // Unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(
        `Unhandled Promise Rejection: ${event.reason}`,
        'Promise',
        event.reason?.stack || String(event.reason),
        'error'
      );
    };

    // Enhanced fetch monitoring with recovery options
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Track HTTP errors with recovery context
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : 
                     args[0] instanceof URL ? args[0].href : args[0].url;
          const responseText = await response.clone().text().catch(() => 'Unable to read response');
          
          trackNetworkError(url, response.status, response.statusText, responseText);
        }
        
        return response;
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : 
                   args[0] instanceof URL ? args[0].href : args[0].url;
        
        trackError(
          `Fetch failed: ${error}`,
          'Network Request',
          `URL: ${url}\nError: ${error}`,
          'error'
        );
        throw error;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, [trackError, trackNetworkError]);

  // Enhanced performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor Core Web Vitals and custom metrics
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            trackPerformanceIssue(entry.name, entry.duration, 1000, 'ms');
          } else if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            trackPerformanceIssue('page-load', navEntry.loadEventEnd - navEntry.fetchStart, 3000, 'ms');
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        // Fallback for browsers that don't support all entry types
        observer.observe({ entryTypes: ['measure'] });
      }

      return () => observer.disconnect();
    }
  }, [trackPerformanceIssue]);

  return {
    trackError,
    trackComponentError,
    trackNetworkError,
    trackPerformanceIssue,
    getErrorAnalytics,
    clearErrors: () => globalErrorTracker.clearErrors(),
    requestNotificationPermission: () => errorNotificationManager.requestBrowserNotificationPermission()
  };
};