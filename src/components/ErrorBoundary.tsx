import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-xl font-bold">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
            </p>
            <div className="flex gap-2 justify-center pt-4">
              <Button onClick={this.handleReset} variant="default">
                ลองใหม่
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                โหลดหน้าใหม่
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
