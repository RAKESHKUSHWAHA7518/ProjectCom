import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { ErrorBoundary as ErrorBoundaryComponent } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            We've been notified and are looking into it.
          </p>
        </div>

        {isDev && error && (
          <details className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-left">
            <summary className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-48">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Go to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            <Bug className="w-5 h-5" /> Reload Page
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-gray-400 dark:text-gray-500">
          If this persists, please contact support.
        </p>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children, fallback }) {
  const onReset = () => {
    window.location.reload();
  };

  const onError = (error, errorInfo) => {
    console.error('ErrorBoundary caught:', error, errorInfo);
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  };

  return (
    <ErrorBoundaryComponent
      onReset={onReset}
      onError={onError}
      fallback={fallback || <ErrorFallback />}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}