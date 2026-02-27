import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://plantcommerce.app';
const LATEST_MIGRATION_LASTMOD = new Date('2026-02-27T00:00:00Z');

interface CultivarSitemapRow {
  slug: string;
  updated_at: string | null;
  plant_entities:
    | { slug: string | null }
    | Array<{ slug: string | null }>
    | null;
}

function extractSpeciesSlug(row: CultivarSitemapRow): string | null {
  const relation = row.plant_entities;
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0]?.slug ?? null;
  return relation.slug ?? null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: species }, { data: cultivars }, { data: nurseries }] = await Promise.all([
    supabase
      .from('plant_entities')
      .select('slug')
      .eq('curation_status', 'published'),
    supabase
      .from('cultivars')
      .select('slug, updated_at, plant_entities(slug)')
      .eq('curation_status', 'published'),
    supabase
      .from('nurseries')
      .select('slug, last_scraped_at, updated_at')
      .eq('curation_status', 'published')
      .eq('is_active', true),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/browse`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/marketplace`,
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/nurseries`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  for (const sp of species ?? []) {
    entries.push({
      url: `${BASE_URL}/plants/${sp.slug}`,
      lastModified: LATEST_MIGRATION_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const row of (cultivars ?? []) as CultivarSitemapRow[]) {
    const speciesSlug = extractSpeciesSlug(row);
    if (!speciesSlug) continue;
    entries.push({
      url: `${BASE_URL}/plants/${speciesSlug}/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : LATEST_MIGRATION_LASTMOD,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  for (const nursery of nurseries ?? []) {
    const nurseryLastMod = nursery.last_scraped_at ?? nursery.updated_at ?? null;
    entries.push({
      url: `${BASE_URL}/nurseries/${nursery.slug}`,
      lastModified: nurseryLastMod ? new Date(nurseryLastMod) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return entries;
}
