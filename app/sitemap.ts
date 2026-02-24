import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://plantcommerce.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch all published species
  const { data: species } = await supabase
    .from('plant_entities')
    .select('slug, updated_at')
    .eq('curation_status', 'published');

  // Fetch all published cultivars with their species slug
  const { data: cultivars } = await supabase
    .from('cultivars')
    .select('slug, updated_at, plant_entities(slug)')
    .eq('curation_status', 'published');

  // Fetch all active nurseries
  const { data: nurseries } = await supabase
    .from('nurseries')
    .select('slug, updated_at')
    .eq('curation_status', 'published')
    .eq('is_active', true);

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
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/nurseries`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  for (const sp of species ?? []) {
    entries.push({
      url: `${BASE_URL}/plants/${sp.slug}`,
      lastModified: sp.updated_at,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  for (const cv of cultivars ?? []) {
    const speciesSlug = (cv as any).plant_entities?.slug;
    if (speciesSlug) {
      entries.push({
        url: `${BASE_URL}/plants/${speciesSlug}/${cv.slug}`,
        lastModified: cv.updated_at,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  for (const n of nurseries ?? []) {
    entries.push({
      url: `${BASE_URL}/nurseries/${n.slug}`,
      lastModified: n.updated_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return entries;
}
