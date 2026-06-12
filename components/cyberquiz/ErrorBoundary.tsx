'use client';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class CQErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CQErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/tools/cyberquiz';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[#ef4444]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">Something went wrong</h1>
          <p className="text-[#94a3b8] mb-4 text-sm">An unexpected error occurred.</p>
          {this.state.error && (
            <details className="text-left mb-6">
              <summary className="text-xs text-[#4a4a6a] cursor-pointer hover:text-[#94a3b8] transition-colors mb-1">Error details</summary>
              <pre className="text-xs text-[#ef4444] bg-[#1a1a2e] border border-[#2d2d44] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button onClick={this.handleReset} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors">
            <RefreshCw className="w-4 h-4" /> Go to CyberQuiz
          </button>
        </div>
      </div>
    );
  }
}

export default CQErrorBoundary;
