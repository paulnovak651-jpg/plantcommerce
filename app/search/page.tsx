import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { searchPlants } from '@/lib/queries/search';
import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
import { Badge } from '@/components/Badge';

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
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Search</h1>
      <div className="mb-8">
        <SearchForm defaultValue={q} size="md" />
      </div>

      {q && (
        <p className="mb-4 text-sm text-gray-500">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="space-y-3">
        {results.map((r: any) => {
          const href =
            r.index_source === 'plant_entity'
              ? `/plants/${r.slug}`
              : `/plants/${r.species_slug}/${r.slug}`;

          return (
            <Link
              key={`${r.index_source}-${r.entity_id}`}
              href={href}
              className="block rounded-lg border border-gray-200 p-4 hover:border-green-300 hover:bg-green-50"
            >
              <div className="flex items-center gap-2">
                <Badge label={r.material_type} />
                <h3 className="font-semibold text-green-800">{r.canonical_name}</h3>
              </div>
              {r.botanical_name && (
                <p className="text-sm italic text-gray-500">{r.botanical_name}</p>
              )}
              {r.species_common_name && r.index_source === 'cultivar' && (
                <p className="text-xs text-gray-400">{r.species_common_name}</p>
              )}
              {r.active_offer_count > 0 && (
                <p className="mt-1 text-xs text-green-600">
                  {r.active_offer_count} nursery offer{r.active_offer_count !== 1 ? 's' : ''}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
