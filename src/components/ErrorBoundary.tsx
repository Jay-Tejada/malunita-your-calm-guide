import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error tracking service in production
    if (import.meta.env.PROD) {
      // Could send to Sentry, LogRocket, etc.
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😅</div>
              <h2 className="text-2xl font-semibold mb-2">
                Oops, something went wrong
              </h2>
              <p className="text-muted-foreground mb-6">
                Don't worry, your data is safe. Try refreshing the page.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <pre className="text-xs text-left bg-muted p-4 rounded mb-4 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
