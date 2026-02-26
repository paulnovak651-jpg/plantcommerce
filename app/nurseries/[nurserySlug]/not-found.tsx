import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NurseryNotFound() {
  return (
    <div className="space-y-4 py-12">
      <Text variant="h1">Nursery Not Found</Text>
      <EmptyState
        title="We don't have this nursery listed yet."
        description="View all current nursery listings or search the catalog for available plants."
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/nurseries"
          className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover"
        >
          View all nurseries
        </Link>
        <Link
          href="/search"
          className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          Search
        </Link>
      </div>
    </div>
  );
}
