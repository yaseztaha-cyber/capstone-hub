"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-6">
        <WifiOff className="h-12 w-12 text-gray-500" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You are offline</h1>
      <p className="max-w-md text-sm text-gray-600 mb-6">
        It looks like you lost your internet connection. Some features may be
        unavailable until you are back online. Your cached content is still
        accessible.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center rounded-md bg-teal-700 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 transition-colors"
      >
        Retry
      </button>
      <p className="mt-4 text-xs text-gray-400">
        Check your connection and try again.
      </p>
    </div>
  );
}
