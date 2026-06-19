import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: 24, color: 'var(--red)' }}>
            <h3>Something went wrong{this.props.name ? ` (${this.props.name})` : ''}</h3>
            <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ marginTop: 12, padding: '6px 16px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
