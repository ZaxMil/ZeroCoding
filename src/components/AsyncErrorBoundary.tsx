import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Unknown Component';
    
    // Log error using centralized logger
    logger.error(`Async Error in ${componentName}:`, error, errorInfo);

    // Track error in analytics if available
    if (typeof window !== 'undefined' && (window as any).trackError) {
      (window as any).trackError(
        'async_component_error',
        `${componentName}: ${error.message}`,
        error.stack
      );
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      // Return custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default async error UI
      return (
        <Card className="max-w-lg mx-auto mt-8 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {this.props.componentName ? `${this.props.componentName} Error` : 'Component Error'}
            </h3>
            <p className="text-sm text-muted-foreground">
              This component failed to load properly. You can try refreshing or continue using other parts of the app.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left bg-muted p-3 rounded-md">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Error Details (Development Mode)
              </summary>
              <pre className="text-xs text-destructive overflow-auto whitespace-pre-wrap">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {this.state.retryCount < this.maxRetries && (
              <Button 
                onClick={this.handleRetry}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry ({this.maxRetries - this.state.retryCount} attempts left)
              </Button>
            )}
            
            {this.props.showHomeButton !== false && (
              <Button 
                asChild
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact support.
          </p>
        </Card>
      );
    }

    return this.props.children;
  }
}