import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/api-rate-limit';
import { genusCommonName } from '@/lib/genus-names';

type SuggestionType = 'genus' | 'species' | 'cultivar';

interface AutocompleteSuggestion {
  name: string;
  slug: string;
  type: SuggestionType;
  speciesSlug?: string;
  matchedAlias?: string;
}

interface SearchIndexRow {
  index_source: string;
  entity_id: string;
  slug: string;
  species_slug: string | null;
  canonical_name: string;
  genus: string | null;
  search_text: string;
  alias_names: string | null;
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

/**
 * Find the best matching alias from a pipe-separated alias_names string.
 * Prefers aliases that start with the needle, falls back to contains.
 */
function findMatchingAlias(aliasNames: string | null, needle: string): string | undefined {
  if (!aliasNames) return undefined;
  const aliases = aliasNames.split('|');
  let bestMatch: string | undefined;
  for (const alias of aliases) {
    const lower = alias.toLowerCase();
    if (lower.startsWith(needle)) return alias;
    if (!bestMatch && lower.includes(needle)) bestMatch = alias;
  }
  return bestMatch;
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
    .select('index_source, entity_id, slug, species_slug, canonical_name, genus, search_text, alias_names')
    .ilike('search_text', `%${needle}%`)
    .limit(FETCH_LIMIT);

  if (error) {
    console.error('autocomplete error:', error);
    return apiError('AUTOCOMPLETE_FAILED', 'Unable to fetch autocomplete suggestions', 500);
  }

  const rows = ((data ?? []) as SearchIndexRow[]).filter(
    (row) => row.slug && row.canonical_name
  );

  const genusBySlug = new Map<string, RankedSuggestion>();
  const speciesBySlug = new Map<string, RankedSuggestion>();
  const cultivarBySlug = new Map<string, RankedSuggestion>();

  for (const row of rows) {
    const nameMatchRank = rankMatch(row.canonical_name, needle);
    const isAliasMatch = nameMatchRank === Number.MAX_SAFE_INTEGER;
    const matchedAlias = isAliasMatch ? findMatchingAlias(row.alias_names, needle) : undefined;

    // Use search_text rank as fallback for alias-only matches
    const effectiveRank = isAliasMatch
      ? rankMatch(row.search_text, needle) + 500 // slight penalty so direct name matches rank higher
      : nameMatchRank;

    if (row.genus) {
      const plainSlug = toSlug(row.genus);
      // DB taxonomy_nodes use genus- prefix (e.g. "genus-diospyros")
      const dbSlug = `genus-${plainSlug}`;
      if (plainSlug) {
        const commonName = genusCommonName(plainSlug);
        const displayName = commonName ?? row.genus;
        const genusRank = Math.min(
          rankMatch(displayName, needle),
          rankMatch(row.genus, needle)
        );

        if (genusRank < Number.MAX_SAFE_INTEGER && !genusBySlug.has(dbSlug)) {
          genusBySlug.set(dbSlug, {
            name: displayName,
            slug: dbSlug,
            type: 'genus',
            rank: genusRank,
          });
        }
      }
    }

    if (row.index_source === 'plant_entity') {
      if (effectiveRank < Number.MAX_SAFE_INTEGER && !speciesBySlug.has(row.slug)) {
        speciesBySlug.set(row.slug, {
          name: row.canonical_name,
          slug: row.slug,
          type: 'species',
          matchedAlias,
          rank: effectiveRank,
        });
      }
    }

    if (row.index_source === 'cultivar') {
      if (effectiveRank < Number.MAX_SAFE_INTEGER && !cultivarBySlug.has(row.slug)) {
        cultivarBySlug.set(row.slug, {
          name: row.canonical_name,
          slug: row.slug,
          type: 'cultivar',
          speciesSlug: row.species_slug ?? undefined,
          matchedAlias,
          rank: effectiveRank,
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
