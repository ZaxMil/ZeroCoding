// Core error tracking utilities (refactored from useErrorTracking.ts)
export interface ErrorDetails {
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

export interface ErrorTrackingConfig {
  enableToasts?: boolean;
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  userId?: string;
  maxErrors?: number;
  errorTtl?: number;
}

export class ErrorTracker {
  private errors: ErrorDetails[] = [];
  private config: Required<ErrorTrackingConfig>;

  constructor(config: ErrorTrackingConfig = {}) {
    this.config = {
      enableToasts: config.enableToasts ?? false,
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableRemoteLogging: config.enableRemoteLogging ?? true,
      userId: config.userId ?? '',
      maxErrors: config.maxErrors ?? 100,
      errorTtl: config.errorTtl ?? 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  // Track error with full context
  trackError(
    message: string,
    source?: string,
    stack?: string,
    level: 'error' | 'warning' | 'info' = 'error'
  ): ErrorDetails {
    const errorDetails: ErrorDetails = {
      message,
      source,
      stack,
      userId: this.config.userId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date(),
      level
    };

    // Add to local storage
    this.addError(errorDetails);

    // Console logging
    if (this.config.enableConsoleLogging) {
      const logMethod = level === 'error' ? console.error : 
                      level === 'warning' ? console.warn : console.info;
      logMethod(`[${level.toUpperCase()}] ${message}`, errorDetails);
    }

    // Remote logging (placeholder for actual implementation)
    if (this.config.enableRemoteLogging) {
      this.logToRemote(errorDetails);
    }

    return errorDetails;
  }

  // Add error to local collection
  private addError(error: ErrorDetails): void {
    this.errors.push(error);
    
    // Maintain max errors limit
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }
    
    // Clean old errors
    this.cleanOldErrors();
  }

  // Clean errors older than TTL
  private cleanOldErrors(): void {
    const now = new Date();
    this.errors = this.errors.filter(error => 
      now.getTime() - error.timestamp.getTime() < this.config.errorTtl
    );
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    recentErrors: ErrorDetails[];
    errorFrequency: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(error => 
      error.timestamp >= oneHourAgo
    );

    const errorsByLevel = this.errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errors.length,
      errorsByLevel,
      recentErrors: this.errors.slice(-10), // Last 10 errors
      errorFrequency: recentErrors.length // Errors per hour
    };
  }

  // Remote logging placeholder
  private async logToRemote(errorDetails: ErrorDetails): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Tracked (Remote)');
      console.error('Message:', errorDetails.message);
      console.error('Source:', errorDetails.source);
      console.error('URL:', errorDetails.url);
      console.error('User ID:', errorDetails.userId);
      console.error('Stack:', errorDetails.stack);
      console.groupEnd();
    }

    // TODO: Implement actual remote logging
    // try {
    //   await fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorDetails)
    //   });
    // } catch (error) {
    //   console.error('Failed to log error to remote service:', error);
    // }
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
  }

  // Update configuration
  updateConfig(newConfig: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance for global use
export const globalErrorTracker = new ErrorTracker();