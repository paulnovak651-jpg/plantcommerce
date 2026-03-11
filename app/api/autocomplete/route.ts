import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/api-rate-limit';
import { GENUS_COMMON_NAMES } from '@/lib/genus-names';

type SuggestionType = 'genus' | 'species' | 'cultivar';

interface AutocompleteSuggestion {
  name: string;
  slug: string;
  type: SuggestionType;
  speciesSlug?: string;
}

interface SearchIndexRow {
  index_source: string;
  slug: string;
  species_slug: string | null;
  canonical_name: string;
  genus: string | null;
}

interface RankedSuggestion extends AutocompleteSuggestion {
  rank: number;
}

const MAX_RESULTS = 8;
const FETCH_LIMIT = 40;

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rankMatch(value: string, needle: string): number {
  const text = value.toLowerCase();
  const index = text.indexOf(needle);
  if (index === -1) return Number.MAX_SAFE_INTEGER;
  return index * 1000 + text.length;
}

function pickTop(items: RankedSuggestion[]): RankedSuggestion[] {
  return items
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.name.localeCompare(b.name);
    })
    .slice(0, MAX_RESULTS);
}

function interleaveGroups(
  genera: RankedSuggestion[],
  species: RankedSuggestion[],
  cultivars: RankedSuggestion[]
): AutocompleteSuggestion[] {
  const results: AutocompleteSuggestion[] = [];
  const queues = [genera, species, cultivars];
  let cursor = 0;

  while (results.length < MAX_RESULTS && queues.some((q) => q.length > 0)) {
    const queue = queues[cursor % queues.length];
    const next = queue.shift();
    if (next) {
      const { rank: _rank, ...item } = next;
      results.push(item);
    }
    cursor += 1;
  }

  return results;
}

export const GET = withRateLimit(async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) {
    return apiSuccess<AutocompleteSuggestion[]>([]);
  }

  const needle = q.toLowerCase();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('material_search_index')
    .select('index_source, slug, species_slug, canonical_name, genus, search_text')
    .ilike('search_text', `%${needle}%`)
    .limit(FETCH_LIMIT);

  if (error) {
    console.error('autocomplete error:', error);
    return apiError('AUTOCOMPLETE_FAILED', 'Unable to fetch autocomplete suggestions', 500);
  }

  const rows = ((data ?? []) as SearchIndexRow[]).filter((row) => row.slug && row.canonical_name);

  const genusBySlug = new Map<string, RankedSuggestion>();
  const speciesBySlug = new Map<string, RankedSuggestion>();
  const cultivarBySlug = new Map<string, RankedSuggestion>();

  for (const row of rows) {
    if (row.genus) {
      const genusSlug = toSlug(row.genus);
      if (genusSlug) {
        const commonName = GENUS_COMMON_NAMES[genusSlug];
        const displayName = commonName ?? row.genus;
        const genusRank = Math.min(
          rankMatch(displayName, needle),
          rankMatch(row.genus, needle)
        );

        if (genusRank < Number.MAX_SAFE_INTEGER && !genusBySlug.has(genusSlug)) {
          genusBySlug.set(genusSlug, {
            name: displayName,
            slug: genusSlug,
            type: 'genus',
            rank: genusRank,
          });
        }
      }
    }

    if (row.index_source === 'plant_entity') {
      const rank = rankMatch(row.canonical_name, needle);
      if (rank < Number.MAX_SAFE_INTEGER && !speciesBySlug.has(row.slug)) {
        speciesBySlug.set(row.slug, {
          name: row.canonical_name,
          slug: row.slug,
          type: 'species',
          rank,
        });
      }
    }

    if (row.index_source === 'cultivar') {
      const rank = rankMatch(row.canonical_name, needle);
      if (rank < Number.MAX_SAFE_INTEGER && !cultivarBySlug.has(row.slug)) {
        cultivarBySlug.set(row.slug, {
          name: row.canonical_name,
          slug: row.slug,
          type: 'cultivar',
          speciesSlug: row.species_slug ?? undefined,
          rank,
        });
      }
    }
  }

  const suggestions = interleaveGroups(
    pickTop(Array.from(genusBySlug.values())),
    pickTop(Array.from(speciesBySlug.values())),
    pickTop(Array.from(cultivarBySlug.values()))
  );

  return apiSuccess(suggestions);
}, { max: 120 });
