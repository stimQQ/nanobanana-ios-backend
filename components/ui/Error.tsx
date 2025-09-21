'use client';

import React from 'react';
import { Button } from './Button';

interface ErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export const Error: React.FC<ErrorProps> = ({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
      <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-[#FFD700] mb-2">{title}</h2>
        <p className="text-gray-400 mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} reset={this.reset} />;
      }

      return (
        <Error
          title="Application Error"
          message={this.state.error.message || 'An unexpected error occurred'}
          onRetry={this.reset}
        />
      );
    }

    return this.props.children;
  }
}