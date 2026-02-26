'use client';

import { useEffect } from 'react';

export default function CultivarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Cultivar route error:', error);
  }, [error]);

  return (
    <div className="py-12 text-center">
      <h2 className="mb-2 font-serif text-xl text-text-primary">
        Unable to load this cultivar
      </h2>
      <p className="mb-6 text-sm text-text-tertiary">
        We encountered an issue loading this page. This is usually temporary.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-accent px-4 py-2 text-sm text-text-inverse hover:bg-accent/90"
      >
        Try again
      </button>
    </div>
  );
}
