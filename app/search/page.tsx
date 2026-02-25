import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { searchPlants } from '@/lib/queries/search';
import Link from 'next/link';
import { SearchBar } from '@/components/ui/SearchBar';
import { Surface } from '@/components/ui/Surface';
import { Tag } from '@/components/ui/Tag';
import { BotanicalName } from '@/components/ui/BotanicalName';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = '' } = await searchParams;

  if (!q) {
    return {
      title: 'Search',
      description: 'Search plants, cultivars, and nurseries across the permaculture community.',
    };
  }

  return {
    title: `Search: "${q}"`,
    description: `Search results for "${q}" — plants, cultivars, and nursery availability.`,
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const supabase = await createClient();
  const results = q ? await searchPlants(supabase, q) : [];

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <section className="flex flex-col items-center py-8 text-center">
        <h1 className="mb-4 font-serif text-[1.8rem] font-semibold leading-[1.2] text-text-primary">
          Search
        </h1>
        <SearchBar defaultValue={q} />
      </section>

      {q && (
        <p className="text-sm text-text-tertiary">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
        </p>
      )}

      {q && results.length === 0 && (
        <EmptyState
          title="No results found"
          description={`We couldn't find anything matching "${q}". Try a different search term.`}
          action={{ label: 'Browse All Plants', href: '/' }}
        />
      )}

      <div className="space-y-3">
        {results.map((r: any) => {
          const href =
            r.index_source === 'plant_entity'
              ? `/plants/${r.slug}`
              : `/plants/${r.species_slug}/${r.slug}`;

          return (
            <Link key={`${r.index_source}-${r.entity_id}`} href={href}>
              <Surface elevation="raised" padding="default" className="hover:border-accent">
                <div className="flex items-center gap-2">
                  <Tag type="neutral">{r.material_type.replace(/_/g, ' ')}</Tag>
                  <h3 className="font-medium text-accent">{r.canonical_name}</h3>
                </div>
                {r.botanical_name && (
                  <p className="mt-1 text-sm text-text-secondary">
                    <BotanicalName>{r.botanical_name}</BotanicalName>
                  </p>
                )}
                {r.species_common_name && r.index_source === 'cultivar' && (
                  <p className="text-xs text-text-tertiary">{r.species_common_name}</p>
                )}
                {r.active_offer_count > 0 && (
                  <div className="mt-2">
                    <Tag type="availability">
                      {r.active_offer_count} nursery offer{r.active_offer_count !== 1 ? 's' : ''}
                    </Tag>
                  </div>
                )}
              </Surface>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
