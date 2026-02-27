import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://plantcommerce.app';

interface FeedEntry {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  guid: string;
}

interface CultivarFeedRow {
  slug: string;
  canonical_name: string;
  created_at: string | null;
  plant_entities:
    | { slug: string | null; canonical_name: string | null }
    | Array<{ slug: string | null; canonical_name: string | null }>
    | null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveCultivarSpecies(
  row: CultivarFeedRow
): { slug: string | null; canonical_name: string | null } {
  if (!row.plant_entities) return { slug: null, canonical_name: null };
  if (Array.isArray(row.plant_entities)) {
    return row.plant_entities[0] ?? { slug: null, canonical_name: null };
  }
  return row.plant_entities;
}

export async function GET() {
  const supabase = await createClient();

  const [{ data: species }, { data: cultivars }, { data: nurseries }] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('slug, canonical_name, botanical_name, created_at')
      .eq('curation_status', 'published'),
    supabase
      .from('cultivars')
      .select('slug, canonical_name, created_at, plant_entities(slug, canonical_name)')
      .eq('curation_status', 'published'),
    supabase
      .from('nurseries')
      .select('slug, name, created_at')
      .eq('curation_status', 'published')
      .eq('is_active', true),
  ]);

  const entries: FeedEntry[] = [];

  for (const sp of species ?? []) {
    const pubDate = sp.created_at ? new Date(sp.created_at) : new Date();
    const botanical = sp.botanical_name ? ` (${sp.botanical_name})` : '';
    entries.push({
      title: `New species: ${sp.canonical_name}${botanical}`,
      link: `${BASE_URL}/plants/${sp.slug}`,
      description: `Added ${sp.canonical_name}${botanical} to Plant Commerce.`,
      pubDate,
      guid: `species-${sp.slug}`,
    });
  }

  for (const row of (cultivars ?? []) as CultivarFeedRow[]) {
    const speciesInfo = resolveCultivarSpecies(row);
    if (!speciesInfo.slug) continue;
    const pubDate = row.created_at ? new Date(row.created_at) : new Date();
    entries.push({
      title: `New cultivar: ${row.canonical_name}`,
      link: `${BASE_URL}/plants/${speciesInfo.slug}/${row.slug}`,
      description: `Added cultivar ${row.canonical_name}${
        speciesInfo.canonical_name ? ` for ${speciesInfo.canonical_name}` : ''
      }.`,
      pubDate,
      guid: `cultivar-${row.slug}`,
    });
  }

  for (const nursery of nurseries ?? []) {
    const pubDate = nursery.created_at ? new Date(nursery.created_at) : new Date();
    entries.push({
      title: `New nursery: ${nursery.name}`,
      link: `${BASE_URL}/nurseries/${nursery.slug}`,
      description: `${nursery.name} is now listed on Plant Commerce.`,
      pubDate,
      guid: `nursery-${nursery.slug}`,
    });
  }

  const sortedEntries = entries
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 50);

  const itemsXml = sortedEntries
    .map(
      (entry) => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.link)}</link>
      <guid>${escapeXml(entry.guid)}</guid>
      <description>${escapeXml(entry.description)}</description>
      <pubDate>${entry.pubDate.toUTCString()}</pubDate>
    </item>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Plant Commerce Feed</title>
    <link>${BASE_URL}</link>
    <description>New species, cultivars, and nurseries added to Plant Commerce.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
