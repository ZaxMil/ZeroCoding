import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, Shield, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { errorRecoverySystem } from '@/utils/errorRecoverySystem';
import { logger } from '@/utils/logger';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableAutoRecovery?: boolean;
  context?: any;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRecovering: boolean;
  recoveryAnalysis?: {
    pattern?: any;
    analytics: any;
    recoveryAction?: () => Promise<boolean>;
    preventionSuggestions: string[];
  };
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private recoveryTimeoutId?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    isRecovering: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('EnhancedErrorBoundary caught an error:', error, errorInfo);
    
    // Analyze error and get recovery options
    const recoveryAnalysis = errorRecoverySystem.analyzeError(error, this.props.context);
    
    this.setState({
      errorInfo,
      recoveryAnalysis
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-recovery if enabled and recovery action available
    if (this.props.enableAutoRecovery && recoveryAnalysis.recoveryAction) {
      this.attemptAutoRecovery();
    }
  }

  private attemptAutoRecovery = async () => {
    if (!this.state.recoveryAnalysis?.recoveryAction) return;

    this.setState({ isRecovering: true });

    try {
      const success = await this.state.recoveryAnalysis.recoveryAction();
      
      if (success) {
        // Reset error state after successful recovery
        this.recoveryTimeoutId = setTimeout(() => {
          this.setState({ 
            hasError: false, 
            error: undefined, 
            errorInfo: undefined,
            isRecovering: false,
            recoveryAnalysis: undefined
          });
        }, 2000);
      } else {
        this.setState({ isRecovering: false });
      }
    } catch (recoveryError) {
      logger.error('Auto-recovery failed:', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private handleManualRetry = async () => {
    if (this.state.recoveryAnalysis?.recoveryAction) {
      await this.attemptAutoRecovery();
    } else {
      // Simple retry by resetting error state
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        recoveryAnalysis: undefined
      });
    }
  };

  componentWillUnmount() {
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Return custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { recoveryAnalysis, isRecovering } = this.state;
      const pattern = recoveryAnalysis?.pattern;
      const analytics = recoveryAnalysis?.analytics;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                  {pattern && (
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      pattern.severity === 'critical' ? 'bg-red-500' : 
                      pattern.severity === 'high' ? 'bg-orange-500' : 
                      pattern.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}>
                      !
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {isRecovering ? 'Attempting Recovery...' : 'Application Error'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRecovering 
                    ? 'Our system is attempting to automatically recover from this error.'
                    : 'We encountered an unexpected error. Our advanced error recovery system has analyzed the issue.'
                  }
                </p>
              </div>

              {/* Error Pattern Info */}
              {pattern && !isRecovering && (
                <div className="bg-muted p-4 rounded-lg text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Error Pattern Detected</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Type:</strong> {pattern.id}</p>
                    <p><strong>Severity:</strong> 
                      <span className={`ml-1 capitalize ${
                        pattern.severity === 'critical' ? 'text-red-500' : 
                        pattern.severity === 'high' ? 'text-orange-500' : 
                        pattern.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`}>
                        {pattern.severity}
                      </span>
                    </p>
                    {analytics && (
                      <p><strong>Frequency:</strong> {analytics.errorCount} occurrences, {analytics.frequency.toFixed(2)}/hour</p>
                    )}
                  </div>
                </div>
              )}

              {/* Prevention Suggestions */}
              {recoveryAnalysis?.preventionSuggestions && recoveryAnalysis.preventionSuggestions.length > 0 && !isRecovering && (
                <div className="bg-muted p-4 rounded-lg text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Prevention Suggestions</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {recoveryAnalysis.preventionSuggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && !isRecovering && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono">
                    <div className="text-destructive font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo && (
                      <div className="mt-3">
                        <div className="text-destructive font-semibold">Component Stack:</div>
                        <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            {!isRecovering && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={this.handleManualRetry}
                    className="flex-1"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {recoveryAnalysis?.recoveryAction ? 'Smart Recovery' : 'Try Again'}
                  </Button>
                  
                  <Button 
                    asChild
                    variant="outline"
                    className="flex-1"
                  >
                    <Link to="/">
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Link>
                  </Button>
                </div>

                {/* Error Analytics Link for Admins */}
                <Button 
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Link to="/admin/error-monitoring">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Error Analytics
                  </Link>
                </Button>
              </div>
            )}

            {/* Recovery Progress */}
            {isRecovering && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Recovery in progress...</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2">
              {isRecovering 
                ? 'Please wait while we attempt to resolve the issue.'
                : 'If this problem persists, please contact support with the error details above.'
              }
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;