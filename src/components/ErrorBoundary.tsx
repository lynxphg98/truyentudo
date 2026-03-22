import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error caught by boundary:', error);
    console.error('Error Info:', errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) || (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
            <div className="max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-slate-200">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4 text-slate-900 tracking-tight">
                Cổng hệ thống gặp sự cố
              </h2>
              <p className="text-slate-500 mb-8 text-sm">{this.state.error.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={this.retry}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 py-3 bg-slate-200 text-slate-900 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
