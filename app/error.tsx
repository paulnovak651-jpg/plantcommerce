'use client';

import { useEffect } from 'react';
import { Text } from '@/components/ui/Text';

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
      <Text variant="h1" as="p" className="mb-2 text-status-error">
        Something went wrong
      </Text>
      <Text variant="body" color="secondary" className="mb-8">
        An unexpected error occurred. Please try again.
      </Text>
      <button
        onClick={reset}
        className="rounded-[var(--radius-md)] bg-accent px-6 py-2 font-medium text-text-inverse hover:bg-accent-hover"
      >
        Try Again
      </button>
    </div>
  );
}
