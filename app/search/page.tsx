import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { searchPlants } from '@/lib/queries/search';
import { parseSearchUrlStateFromRecord } from '@/lib/contracts/ux';
import Link from 'next/link';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { Tag } from '@/components/ui/Tag';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchFilters } from '@/components/SearchFilters';
import type { SearchResult } from '@/lib/types';

interface Props {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    zone?: string;
    category?: string;
    inStock?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const state = parseSearchUrlStateFromRecord(await searchParams);
  const q = state.q;

  if (!q) {
    const description = 'Search plants, cultivars, and nurseries across the permaculture community.';
    return {
      title: 'Search',
      description,
      openGraph: {
        title: 'Search | Plant Commerce',
        description,
        url: 'https://plantcommerce.app/search',
      },
      twitter: { card: 'summary' },
    };
  }

  const description = `Search results for "${q}" - plants, cultivars, and nursery availability.`;
  return {
    title: `Search: "${q}"`,
    description,
    openGraph: {
      title: `Search: "${q}" | Plant Commerce`,
      description,
      url: `https://plantcommerce.app/search?q=${encodeURIComponent(q)}`,
    },
    twitter: { card: 'summary' },
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const state = parseSearchUrlStateFromRecord(sp);
  const q = state.q;
  const { zone, category, inStock } = state;
  const shouldSearch = Boolean(q || category || inStock || zone);
  const supabase = await createClient();
  const results = shouldSearch
    ? await searchPlants(supabase, {
        q,
        limit: state.limit,
        zone,
        category,
        inStock,
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
      <section className="flex flex-col items-center py-8 text-center">
        <Text variant="h1" className="mb-4">Search</Text>
        <SearchBar defaultValue={q} />
      </section>

      <SearchFilters
        currentZone={zone}
        currentCategory={category}
        currentInStock={inStock}
      />

      {q && (
        <Text variant="sm" color="tertiary">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
        </Text>
      )}

      {q && results.length === 0 && (
        <EmptyState
          title="No results found"
          description={`No matches for "${q}". Try a broader term or browse by species.`}
          action={{ label: 'Browse All Plants', href: '/' }}
        />
      )}

      <div className="space-y-0">
        {results.map((r: SearchResult) => {
          const href =
            r.index_source === 'plant_entity'
              ? `/plants/${r.slug}`
              : `/plants/${r.species_slug}/${r.slug}`;

          return (
            <Link key={`${r.index_source}-${r.entity_id}`} href={href}>
              <div className="border-b border-border-subtle py-4 transition-colors hover:bg-surface-primary">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag type="neutral">{r.material_type.replace(/_/g, ' ')}</Tag>
                  <Text variant="h3" color="accent">{r.canonical_name}</Text>
                  {r.usda_zone_min != null && r.usda_zone_max != null && (
                    <Tag type="neutral">Zone {r.usda_zone_min}-{r.usda_zone_max}</Tag>
                  )}
                  {r.active_offer_count > 0 && (
                    <Tag type="availability">
                      {r.active_offer_count} {r.active_offer_count === 1 ? 'nursery' : 'nurseries'}
                    </Tag>
                  )}
                </div>
                {r.botanical_name && (
                  <Text variant="sm" color="secondary" className="mt-1">
                    <BotanicalName>{r.botanical_name}</BotanicalName>
                  </Text>
                )}
                {r.species_common_name && r.index_source === 'cultivar' && (
                  <Text variant="caption" color="tertiary">{r.species_common_name}</Text>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
}

