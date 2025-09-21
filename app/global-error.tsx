'use client';

import React from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log the error to console for debugging
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-dark text-gray-300 antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-dark-secondary border-2 border-primary/30 flex items-center justify-center animate-pulse">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Error Content */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-yellow-400 mb-4">
                Application Error
              </h1>
              <p className="text-gray-400 mb-6">
                A critical error occurred and the application could not recover.
                This might be due to a configuration issue or system error.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 p-4 bg-dark-secondary rounded-lg border border-primary/20 text-left">
                  <summary className="text-primary cursor-pointer mb-3 text-center font-medium">
                    View Error Details (Development Only)
                  </summary>
                  <div className="space-y-3">
                    <div>
                      <strong className="text-primary">Message:</strong>
                      <p className="text-sm text-gray-300 mt-1 p-2 bg-dark rounded">
                        {error.message}
                      </p>
                    </div>
                    {error.digest && (
                      <div>
                        <strong className="text-primary">Digest:</strong>
                        <p className="text-sm text-gray-300 mt-1 p-2 bg-dark rounded font-mono">
                          {error.digest}
                        </p>
                      </div>
                    )}
                    {error.stack && (
                      <div>
                        <strong className="text-primary">Stack Trace:</strong>
                        <pre className="text-xs text-gray-300 mt-1 p-2 bg-dark rounded overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full bg-primary hover:bg-primary-dark text-dark font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Reset Application
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-dark font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Reload Page
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-12 pt-6 border-t border-primary/20">
              <h3 className="text-lg font-semibold text-primary mb-3">
                Need Help?
              </h3>
              <div className="text-sm text-gray-500 space-y-2">
                <p>
                  If this error continues to occur, try:
                </p>
                <ul className="text-left space-y-1 max-w-xs mx-auto">
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Disable browser extensions</li>
                  <li>• Try using an incognito/private window</li>
                  <li>• Contact our support team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }
        `}</style>
      </body>
    </html>
  );
}