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
    <div className="flex flex-col items-center py-16 text-center">
      <p className="mb-2 font-serif text-[2rem] font-semibold text-status-error">
        Something went wrong
      </p>
      <p className="mb-8 text-text-secondary">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-[var(--radius-md)] bg-accent px-6 py-2 font-medium text-text-inverse hover:bg-accent-hover"
      >
        Try Again
      </button>
    </div>
  );
}
