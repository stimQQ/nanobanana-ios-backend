'use client';

import React from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  React.useEffect(() => {
    // Log the error to console for debugging
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-secondary border border-primary/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-primary"
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

        {/* Error Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-400 mb-2">
            We encountered an unexpected error while loading this page.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-dark-secondary rounded-lg border border-primary/20">
              <summary className="text-primary cursor-pointer mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-gray-300 text-left overflow-auto">
                {error.message}
                {error.stack && '\n\nStack:\n' + error.stack}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full btn-primary px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full btn-secondary px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Go Home
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-primary/20">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}