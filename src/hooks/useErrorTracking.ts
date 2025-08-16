import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
}

interface UseErrorTrackingOptions {
  enableToasts?: boolean;
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  userId?: string;
}

export const useErrorTracking = (options: UseErrorTrackingOptions = {}) => {
  const { toast } = useToast();
  const {
    enableToasts = false,
    enableConsoleLogging = true,
    enableRemoteLogging = true,
    userId
  } = options;

  // Log error to remote service
  const logToRemote = useCallback(async (errorDetails: ErrorDetails) => {
    if (!enableRemoteLogging) return;

    try {
      // In a real implementation, this would send to your error tracking service
      // For now, we'll use the browser's console
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Error Tracked');
        console.error('Message:', errorDetails.message);
        console.error('Source:', errorDetails.source);
        console.error('URL:', errorDetails.url);
        console.error('User ID:', errorDetails.userId);
        console.error('Stack:', errorDetails.stack);
        console.groupEnd();
      }

      // TODO: Replace with actual remote logging service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorDetails)
      // });
    } catch (logError) {
      console.error('Failed to log error to remote service:', logError);
    }
  }, [enableRemoteLogging]);

  // Track JavaScript errors
  const trackError = useCallback((
    message: string,
    source?: string,
    stack?: string,
    level: 'error' | 'warning' | 'info' = 'error'
  ) => {
    const errorDetails: ErrorDetails = {
      message,
      source,
      stack,
      userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      level
    };

    // Console logging
    if (enableConsoleLogging) {
      const logMethod = level === 'error' ? console.error : 
                      level === 'warning' ? console.warn : console.info;
      logMethod(`[${level.toUpperCase()}] ${message}`, errorDetails);
    }

    // Toast notification
    if (enableToasts && level === 'error') {
      toast({
        title: "An error occurred",
        description: message,
        variant: "destructive",
      });
    }

    // Remote logging
    logToRemote(errorDetails);

    return errorDetails;
  }, [userId, enableConsoleLogging, enableToasts, toast, logToRemote]);

  // Track React component errors
  const trackComponentError = useCallback((
    error: Error,
    errorInfo: { componentStack?: string },
    source?: string
  ) => {
    return trackError(
      error.message,
      source || 'React Component',
      error.stack + (errorInfo.componentStack ? `\n\nComponent Stack:${errorInfo.componentStack}` : ''),
      'error'
    );
  }, [trackError]);

  // Track network errors
  const trackNetworkError = useCallback((
    url: string,
    status: number,
    statusText: string,
    responseText?: string
  ) => {
    return trackError(
      `Network error: ${status} ${statusText}`,
      'Network Request',
      `URL: ${url}\nStatus: ${status} ${statusText}\nResponse: ${responseText || 'No response body'}`,
      status >= 500 ? 'error' : 'warning'
    );
  }, [trackError]);

  // Track performance issues
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

  // Set up global error handlers
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

    // Network errors (fetch failures)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Track HTTP errors
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url;
          const responseText = await response.clone().text().catch(() => 'Unable to read response');
          trackNetworkError(url, response.status, response.statusText, responseText);
        }
        
        return response;
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url;
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

  // Performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            trackPerformanceIssue(entry.name, entry.duration, 1000, 'ms');
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => observer.disconnect();
    }
  }, [trackPerformanceIssue]);

  return {
    trackError,
    trackComponentError,
    trackNetworkError,
    trackPerformanceIssue
  };
};