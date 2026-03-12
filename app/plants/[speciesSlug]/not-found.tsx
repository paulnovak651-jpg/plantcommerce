import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SpeciesNotFound() {
  return (
    <div className="space-y-4 py-12">
      <Text variant="h1">Species Not Found</Text>
      <EmptyState
        title="This species isn't in our database yet."
        description="Try browsing all published species or run a search for a different cultivar."
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover"
        >
          Browse all species
        </Link>
        <Link
          href="/search"
          className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          Search for something else
        </Link>
      </div>
    </div>
  );
}
