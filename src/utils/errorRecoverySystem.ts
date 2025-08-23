// Advanced Error Recovery System with predictive error prevention
import { logger } from './logger';

interface ErrorPattern {
  id: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoveryAction: string;
  preventionTips: string[];
}

interface ErrorAnalytics {
  errorCount: number;
  lastOccurrence: Date;
  frequency: number;
  userImpact: 'low' | 'medium' | 'high';
  resolvedCount: number;
}

interface ErrorRecoveryState {
  isRecovering: boolean;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  lastRecoveryTime?: Date;
  backoffMultiplier: number;
}

class ErrorRecoverySystem {
  private errorPatterns: ErrorPattern[] = [
    {
      id: 'network-timeout',
      pattern: /timeout|network|fetch.*failed/i,
      severity: 'medium',
      recoveryAction: 'retry-with-backoff',
      preventionTips: [
        'Implement connection pooling',
        'Add request timeout configuration',
        'Use circuit breaker pattern'
      ]
    },
    {
      id: 'memory-leak',
      pattern: /memory|heap|out of memory/i,
      severity: 'high',
      recoveryAction: 'gc-cleanup',
      preventionTips: [
        'Review component cleanup',
        'Check for memory leaks in useEffect',
        'Monitor large data structures'
      ]
    },
    {
      id: 'authentication-error',
      pattern: /auth|unauthorized|401|403/i,
      severity: 'medium',
      recoveryAction: 'refresh-token',
      preventionTips: [
        'Implement token refresh mechanism',
        'Add auth state validation',
        'Monitor session expiry'
      ]
    },
    {
      id: 'database-connection',
      pattern: /database|connection|pool/i,
      severity: 'critical',
      recoveryAction: 'reconnect-db',
      preventionTips: [
        'Implement connection health checks',
        'Configure connection pooling',
        'Add retry logic for queries'
      ]
    }
  ];

  private errorAnalytics: Map<string, ErrorAnalytics> = new Map();
  private recoveryState: Map<string, ErrorRecoveryState> = new Map();

  // Analyze error and suggest recovery actions
  analyzeError(error: Error, context?: any): {
    pattern?: ErrorPattern;
    analytics: ErrorAnalytics;
    recoveryAction?: () => Promise<boolean>;
    preventionSuggestions: string[];
  } {
    const errorMessage = error.message || error.toString();
    const matchedPattern = this.errorPatterns.find(pattern => 
      pattern.pattern.test(errorMessage)
    );

    const patternId = matchedPattern?.id || 'unknown';
    
    // Update analytics
    const analytics = this.updateErrorAnalytics(patternId, error);
    
    // Get recovery action
    const recoveryAction = matchedPattern 
      ? this.getRecoveryAction(matchedPattern, error, context)
      : undefined;

    return {
      pattern: matchedPattern,
      analytics,
      recoveryAction,
      preventionSuggestions: this.getPreventionSuggestions(patternId, analytics)
    };
  }

  // Update error analytics
  private updateErrorAnalytics(patternId: string, error: Error): ErrorAnalytics {
    const existing = this.errorAnalytics.get(patternId) || {
      errorCount: 0,
      lastOccurrence: new Date(),
      frequency: 0,
      userImpact: 'low' as const,
      resolvedCount: 0
    };

    const now = new Date();
    const timeDiff = now.getTime() - existing.lastOccurrence.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    existing.errorCount++;
    existing.lastOccurrence = now;
    existing.frequency = existing.errorCount / Math.max(hoursDiff, 1);
    
    // Determine user impact based on frequency and severity
    if (existing.frequency > 10) existing.userImpact = 'high';
    else if (existing.frequency > 3) existing.userImpact = 'medium';
    else existing.userImpact = 'low';

    this.errorAnalytics.set(patternId, existing);
    return existing;
  }

  // Get recovery action for specific error patterns
  private getRecoveryAction(
    pattern: ErrorPattern, 
    error: Error, 
    context?: any
  ): () => Promise<boolean> {
    const patternId = pattern.id;
    
    return async () => {
      const recoveryState = this.getRecoveryState(patternId);
      
      if (recoveryState.recoveryAttempts >= recoveryState.maxRecoveryAttempts) {
        logger.error(`Max recovery attempts reached for ${patternId}`);
        return false;
      }

      recoveryState.isRecovering = true;
      recoveryState.recoveryAttempts++;
      recoveryState.lastRecoveryTime = new Date();

      try {
        const success = await this.executeRecoveryAction(pattern.recoveryAction, error, context);
        
        if (success) {
          // Reset recovery attempts on success
          recoveryState.recoveryAttempts = 0;
          const analytics = this.errorAnalytics.get(patternId);
          if (analytics) {
            analytics.resolvedCount++;
            this.errorAnalytics.set(patternId, analytics);
          }
        }

        return success;
      } catch (recoveryError) {
        logger.error(`Recovery action failed for ${patternId}:`, recoveryError);
        return false;
      } finally {
        recoveryState.isRecovering = false;
        
        // Apply exponential backoff
        const backoffDelay = recoveryState.backoffMultiplier * Math.pow(2, recoveryState.recoveryAttempts);
        await new Promise(resolve => setTimeout(resolve, Math.min(backoffDelay, 30000)));
      }
    };
  }

  // Execute specific recovery actions
  private async executeRecoveryAction(action: string, error: Error, context?: any): Promise<boolean> {
    switch (action) {
      case 'retry-with-backoff':
        if (context?.retryFunction) {
          return await context.retryFunction();
        }
        return false;

      case 'gc-cleanup':
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
        // Clear large caches
        if (context?.clearCaches) {
          await context.clearCaches();
        }
        return true;

      case 'refresh-token':
        if (context?.refreshToken) {
          return await context.refreshToken();
        }
        return false;

      case 'reconnect-db':
        if (context?.reconnectDatabase) {
          return await context.reconnectDatabase();
        }
        return false;

      default:
        logger.warn(`Unknown recovery action: ${action}`);
        return false;
    }
  }

  // Get or create recovery state
  private getRecoveryState(patternId: string): ErrorRecoveryState {
    if (!this.recoveryState.has(patternId)) {
      this.recoveryState.set(patternId, {
        isRecovering: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 3,
        backoffMultiplier: 1000
      });
    }
    return this.recoveryState.get(patternId)!;
  }

  // Get prevention suggestions based on error patterns and analytics
  private getPreventionSuggestions(patternId: string, analytics: ErrorAnalytics): string[] {
    const pattern = this.errorPatterns.find(p => p.id === patternId);
    const baseSuggestions = pattern?.preventionTips || ['Monitor error patterns', 'Implement proper error boundaries'];

    // Add dynamic suggestions based on analytics
    const dynamicSuggestions: string[] = [];

    if (analytics.frequency > 5) {
      dynamicSuggestions.push('Consider implementing circuit breaker pattern');
    }

    if (analytics.userImpact === 'high') {
      dynamicSuggestions.push('Prioritize fixing this error - high user impact detected');
    }

    if (analytics.resolvedCount > 0) {
      const resolutionRate = analytics.resolvedCount / analytics.errorCount;
      if (resolutionRate < 0.5) {
        dynamicSuggestions.push('Review current recovery mechanisms - low resolution rate');
      }
    }

    return [...baseSuggestions, ...dynamicSuggestions];
  }

  // Get comprehensive error report
  getErrorReport(): {
    totalErrors: number;
    criticalErrors: number;
    topErrorPatterns: Array<{ patternId: string; analytics: ErrorAnalytics }>;
    recoverySuccess: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const totalErrors = Array.from(this.errorAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.errorCount, 0);
    
    const criticalErrors = Array.from(this.errorAnalytics.entries())
      .filter(([patternId]) => {
        const pattern = this.errorPatterns.find(p => p.id === patternId);
        return pattern?.severity === 'critical';
      })
      .reduce((sum, [, analytics]) => sum + analytics.errorCount, 0);

    const topErrorPatterns = Array.from(this.errorAnalytics.entries())
      .map(([patternId, analytics]) => ({ patternId, analytics }))
      .sort((a, b) => b.analytics.errorCount - a.analytics.errorCount)
      .slice(0, 5);

    const totalResolved = Array.from(this.errorAnalytics.values())
      .reduce((sum, analytics) => sum + analytics.resolvedCount, 0);
    
    const recoverySuccess = totalErrors > 0 ? (totalResolved / totalErrors) * 100 : 100;

    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalErrors > 0 || recoverySuccess < 50) {
      systemHealth = 'critical';
    } else if (totalErrors > 10 || recoverySuccess < 80) {
      systemHealth = 'warning';
    }

    return {
      totalErrors,
      criticalErrors,
      topErrorPatterns,
      recoverySuccess,
      systemHealth
    };
  }

  // Clear old analytics data
  clearOldAnalytics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = new Date();
    for (const [patternId, analytics] of this.errorAnalytics.entries()) {
      if (now.getTime() - analytics.lastOccurrence.getTime() > maxAge) {
        this.errorAnalytics.delete(patternId);
        this.recoveryState.delete(patternId);
      }
    }
  }
}

export const errorRecoverySystem = new ErrorRecoverySystem();