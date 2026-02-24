'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="mb-2 text-4xl font-bold text-red-700">
        Something went wrong
      </h1>
      <p className="mb-8 text-gray-500">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-green-700 px-6 py-2 font-medium text-white hover:bg-green-800"
      >
        Try Again
      </button>
    </div>
  );
}
