import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getGrowingProfile } from '@/lib/queries/growing';
import { Text } from '@/components/ui/Text';
import { Tag } from '@/components/ui/Tag';
import { Surface } from '@/components/ui/Surface';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Compare Cultivars',
  description: 'Side-by-side comparison of plant cultivars.',
};

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

interface CultivarData {
  id: string;
  canonical_name: string;
  slug: string;
  breeder: string | null;
  material_type: string;
  patent_status: string;
  notes: string | null;
  plant_entities: {
    id: string;
    slug: string;
    canonical_name: string;
    botanical_name: string | null;
    display_category: string | null;
  } | null;
  bestPriceCents: number | null;
  nurseryCount: number;
  zoneMin: number | null;
  zoneMax: number | null;
  heightMin: number | null;
  heightMax: number | null;
  yearsToBearingMin: number | null;
  yearsToBearingMax: number | null;
  harvestSeason: string | null;
  sunRequirement: string | null;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;

  if (!ids) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Text variant="h1" className="mb-4">Compare Cultivars</Text>
        <Text variant="body" color="secondary" className="mb-2">
          Select 2&ndash;4 cultivars from the browse page to compare them side by side.
        </Text>
        <Text variant="caption" color="tertiary" className="mb-8">
          Look for the compare checkbox on plant cards while browsing, or use the
          compare tray at the bottom of the screen.
        </Text>
        <Link href="/#browse" className="inline-block rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors">
          Browse Plants
        </Link>
      </div>
    );
  }

  const cultivarIds = ids.split(',').filter(Boolean).slice(0, 4);

  if (cultivarIds.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Text variant="h1" className="mb-4">Compare Cultivars</Text>
        <Text variant="body" color="secondary">
          Please select at least 2 cultivars to compare.
        </Text>
        <Link href="/#browse" className="mt-6 inline-block rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors">
          Browse Plants
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: cultivarRows } = await supabase
    .from('cultivars')
    .select(`
      id, canonical_name, slug, breeder, material_type, patent_status, notes,
      plant_entities (id, slug, canonical_name, botanical_name, display_category)
    `)
    .in('id', cultivarIds);

  if (!cultivarRows || cultivarRows.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Text variant="h1" className="mb-4">Compare Cultivars</Text>
        <Text variant="body" color="secondary">
          Could not find the requested cultivars. They may have been removed.
        </Text>
        <Link href="/#browse" className="mt-6 inline-block rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors">
          Browse Plants
        </Link>
      </div>
    );
  }

  // Fetch offers for these cultivars
  const { data: offerRows } = await supabase
    .from('inventory_offers')
    .select('cultivar_id, nursery_id, price_cents')
    .in('cultivar_id', cultivarIds)
    .eq('offer_status', 'active');

  const offerStats = new Map<string, { minPrice: number | null; nurseries: Set<string> }>();
  for (const offer of offerRows ?? []) {
    if (!offer.cultivar_id) continue;
    let stats = offerStats.get(offer.cultivar_id);
    if (!stats) {
      stats = { minPrice: null, nurseries: new Set() };
      offerStats.set(offer.cultivar_id, stats);
    }
    stats.nurseries.add(offer.nursery_id);
    if (offer.price_cents != null && (stats.minPrice === null || offer.price_cents < stats.minPrice)) {
      stats.minPrice = offer.price_cents;
    }
  }

  // Fetch growing profiles
  const speciesIds = cultivarRows
    .map((c: any) => c.plant_entities?.id)
    .filter(Boolean) as string[];
  const uniqueSpeciesIds = [...new Set(speciesIds)];

  const profileMap = new Map<string, any>();
  for (const speciesId of uniqueSpeciesIds) {
    const profile = await getGrowingProfile(supabase, speciesId);
    if (profile) profileMap.set(speciesId, profile);
  }

  // Assemble data
  const cultivars: CultivarData[] = cultivarRows.map((c: any) => {
    const stats = offerStats.get(c.id);
    const profile = c.plant_entities?.id ? profileMap.get(c.plant_entities.id) : null;
    return {
      id: c.id,
      canonical_name: c.canonical_name,
      slug: c.slug,
      breeder: c.breeder,
      material_type: c.material_type,
      patent_status: c.patent_status,
      notes: c.notes,
      plant_entities: c.plant_entities,
      bestPriceCents: stats?.minPrice ?? null,
      nurseryCount: stats?.nurseries.size ?? 0,
      zoneMin: profile?.usda_zone_min ?? null,
      zoneMax: profile?.usda_zone_max ?? null,
      heightMin: profile?.mature_height_min_ft ?? null,
      heightMax: profile?.mature_height_max_ft ?? null,
      yearsToBearingMin: profile?.years_to_bearing_min ?? null,
      yearsToBearingMax: profile?.years_to_bearing_max ?? null,
      harvestSeason: profile?.harvest_season ?? null,
      sunRequirement: profile?.sun_requirement ?? null,
    };
  });

  // Sort to match the order of the IDs in the URL
  cultivars.sort((a, b) => cultivarIds.indexOf(a.id) - cultivarIds.indexOf(b.id));

  const rows: { label: string; values: (string | null)[] }[] = [
    {
      label: 'Species',
      values: cultivars.map((c) => c.plant_entities?.canonical_name ?? null),
    },
    {
      label: 'Zones',
      values: cultivars.map((c) =>
        c.zoneMin != null && c.zoneMax != null ? `${c.zoneMin}\u2013${c.zoneMax}` : null
      ),
    },
    {
      label: 'Height',
      values: cultivars.map((c) =>
        c.heightMin != null || c.heightMax != null
          ? c.heightMin != null && c.heightMax != null
            ? `${c.heightMin}\u2013${c.heightMax} ft`
            : `${c.heightMin ?? c.heightMax} ft`
          : null
      ),
    },
    {
      label: 'Years to Bearing',
      values: cultivars.map((c) =>
        c.yearsToBearingMin != null || c.yearsToBearingMax != null
          ? c.yearsToBearingMin != null && c.yearsToBearingMax != null
            ? `${c.yearsToBearingMin}\u2013${c.yearsToBearingMax}`
            : String(c.yearsToBearingMin ?? c.yearsToBearingMax)
          : null
      ),
    },
    {
      label: 'Harvest',
      values: cultivars.map((c) => c.harvestSeason?.replace(/_/g, ' ') ?? null),
    },
    {
      label: 'Sun',
      values: cultivars.map((c) => c.sunRequirement?.replace(/_/g, ' ') ?? null),
    },
    {
      label: 'Best Price',
      values: cultivars.map((c) =>
        c.bestPriceCents != null ? formatPrice(null, c.bestPriceCents) : null
      ),
    },
    {
      label: 'Nurseries',
      values: cultivars.map((c) => (c.nurseryCount > 0 ? String(c.nurseryCount) : null)),
    },
    {
      label: 'Breeder',
      values: cultivars.map((c) => c.breeder),
    },
    {
      label: 'Patent',
      values: cultivars.map((c) =>
        c.patent_status !== 'unknown' ? c.patent_status.replace(/_/g, ' ') : null
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Text variant="h1" className="mb-6">Compare Cultivars</Text>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <Surface elevation="raised" padding="default">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary w-36">
                  Trait
                </th>
                {cultivars.map((c) => (
                  <th key={c.id} className="py-3 px-3 text-left">
                    <Link
                      href={`/plants/${c.plant_entities?.slug ?? ''}/${c.slug}`}
                      className="font-serif text-base font-bold text-accent hover:underline"
                    >
                      {c.canonical_name}
                    </Link>
                    {c.plant_entities && (
                      <div className="mt-0.5 text-xs font-normal italic text-text-tertiary">
                        {c.plant_entities.botanical_name}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hasAnyValue = row.values.some((v) => v != null);
                if (!hasAnyValue) return null;
                return (
                  <tr key={row.label} className="border-b border-border-subtle/50">
                    <td className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      {row.label}
                    </td>
                    {row.values.map((value, i) => (
                      <td key={cultivars[i].id} className="py-2.5 px-3 text-text-primary">
                        {value ?? <span className="text-text-tertiary">&mdash;</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Surface>
      </div>

      {/* Mobile stacked cards */}
      <div className="sm:hidden space-y-4">
        {cultivars.map((c) => (
          <Surface key={c.id} elevation="raised" padding="default">
            <Link
              href={`/plants/${c.plant_entities?.slug ?? ''}/${c.slug}`}
              className="font-serif text-lg font-bold text-accent hover:underline"
            >
              {c.canonical_name}
            </Link>
            {c.plant_entities && (
              <p className="text-xs italic text-text-tertiary mt-0.5">{c.plant_entities.botanical_name}</p>
            )}
            <div className="mt-3 space-y-1.5">
              {rows.map((row) => {
                const idx = cultivars.indexOf(c);
                const value = row.values[idx];
                if (!value) return null;
                return (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-text-tertiary">{row.label}</span>
                    <span className="text-text-primary font-medium">{value}</span>
                  </div>
                );
              })}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
