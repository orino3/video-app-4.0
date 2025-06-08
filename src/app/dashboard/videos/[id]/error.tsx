'use client';

import { useEffect } from 'react';

export default function VideoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Video page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">
          There was an error loading this video. Please try again.
        </p>
        <details className="text-left bg-gray-100 p-4 rounded mb-6">
          <summary className="cursor-pointer font-semibold">
            Error details
          </summary>
          <pre className="mt-2 text-sm overflow-auto">{error.message}</pre>
        </details>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
