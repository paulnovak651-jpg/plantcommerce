import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getMarketplaceListings } from '@/lib/queries/listings';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { ListingCard } from '@/components/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CommunityListing } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Community marketplace for plant material. Browse approved want-to-sell and want-to-buy listings.',
};

interface Props {
  searchParams: Promise<{ type?: string }>;
}

const VALID_TYPES = new Set(['all', 'wts', 'wtb']);

export default async function MarketplacePage({ searchParams }: Props) {
  const sp = await searchParams;
  const type = VALID_TYPES.has(sp.type ?? '') ? (sp.type as 'all' | 'wts' | 'wtb') : 'all';
  const supabase = await createClient();
  const listings = await getMarketplaceListings(supabase, type);

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Marketplace' }]} />

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Text variant="h1">Marketplace</Text>
          <Text variant="body" color="secondary" className="mt-1">
            Community listings for buying, selling, and trading plant material.
          </Text>
        </div>
        <Link
          href="/marketplace/submit"
          className="rounded-[var(--radius-md)] bg-community px-4 py-2 text-sm font-medium text-text-inverse hover:bg-community-hover"
        >
          Submit a Listing
        </Link>
      </section>

      <section className="flex gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'wts', label: 'For Sale' },
          { id: 'wtb', label: 'Wanted' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === 'all' ? '/marketplace' : `/marketplace?type=${tab.id}`}
            className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium ${
              type === tab.id
                ? 'bg-accent text-text-inverse'
                : 'bg-surface-raised text-text-secondary hover:text-accent'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </section>

      <section>
        {listings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="No approved listings match this filter yet."
            action={{ label: 'Submit a Listing', href: '/marketplace/submit' }}
          />
        ) : (
          <div className="space-y-3">
            {listings.map((listing: CommunityListing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
