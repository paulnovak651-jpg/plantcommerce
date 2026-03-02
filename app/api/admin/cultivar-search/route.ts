import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdminStatusAuth } from '@/lib/pipeline/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type SearchItem = { entity_type: 'cultivar' | 'plant_entity'; entity_id: string; canonical_name: string; slug: string; context: string };
type SpeciesRef = { canonical_name: string | null; slug: string | null };
type CultivarRow = { id: string; canonical_name: string; slug: string; plant_entity_id: string; plant_entities: SpeciesRef | SpeciesRef[] | null };
type PlantEntityRow = { id: string; canonical_name: string; slug: string; botanical_name: string | null; genus: string | null };

export async function GET(request: NextRequest) {
  const auth = requireAdminStatusAuth(request);
  if (!auth.ok) return auth.response;

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return apiError('BAD_REQUEST', "Query param 'q' must be at least 2 characters.", 400);
  const rawLimit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 20;

  try {
    const supabase = await createClient();
    const [cultivarRes, entityRes] = await Promise.all([
      supabase
        .from('cultivars')
        .select('id, canonical_name, slug, plant_entity_id, plant_entities(canonical_name, slug)')
        .ilike('canonical_name', `%${q}%`)
        .order('canonical_name')
        .limit(limit),
      supabase
        .from('plant_entities')
        .select('id, canonical_name, slug, botanical_name, genus')
        .ilike('canonical_name', `%${q}%`)
        .order('canonical_name')
        .limit(limit),
    ]);

    if (cultivarRes.error || entityRes.error) {
      return apiError('DB_ERROR', cultivarRes.error?.message ?? entityRes.error?.message ?? 'Search failed', 500);
    }

    const cultivars: SearchItem[] = ((cultivarRes.data ?? []) as CultivarRow[]).map((row) => {
      const species = Array.isArray(row.plant_entities) ? row.plant_entities[0] : row.plant_entities;
      return {
        entity_type: 'cultivar',
        entity_id: row.id,
        canonical_name: row.canonical_name,
        slug: row.slug,
        context: `Cultivar of ${species?.canonical_name ?? 'Unknown species'}`,
      };
    });

    const entities: SearchItem[] = ((entityRes.data ?? []) as PlantEntityRow[]).map((row) => ({
      entity_type: 'plant_entity',
      entity_id: row.id,
      canonical_name: row.canonical_name,
      slug: row.slug,
      context: [row.genus, row.botanical_name].filter(Boolean).join(' - ') || 'Plant Entity',
    }));

    const needle = q.toLowerCase();
    const data = [...cultivars, ...entities]
      .sort((a, b) => {
        const aPrefix = a.canonical_name.toLowerCase().startsWith(needle) ? 0 : 1;
        const bPrefix = b.canonical_name.toLowerCase().startsWith(needle) ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
        return a.canonical_name.localeCompare(b.canonical_name);
      })
      .slice(0, limit);

    return apiSuccess(data);
  } catch (err) {
    return apiError('SERVER_ERROR', String(err), 500);
  }
}
