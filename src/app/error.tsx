'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);

    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).Sentry) {
      const sentry = (window as unknown as { Sentry: unknown }).Sentry;
      try {
        if (typeof sentry === 'function') {
          (sentry as (err: Error) => void)(error);
        } else if (
          sentry &&
          typeof (sentry as { captureException?: unknown }).captureException === 'function'
        ) {
          (sentry as { captureException: (err: Error) => void }).captureException(error);
        }
      } catch {
        // ignore
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full flex flex-col items-center p-8 text-center">
        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 break-words max-w-full">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Error ID: {error.digest}</p>
        )}
        {!error.digest && <div className="mb-6" />}
        <div className="flex items-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw size={16} />
            Retry
          </Button>
          <Link href="/dashboard">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
