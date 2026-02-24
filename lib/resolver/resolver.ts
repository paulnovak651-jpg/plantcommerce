// ============================================================================
// Entity Resolver
// Matches parsed product names against the alias index.
// Port of resolver_test.py resolve() + build_alias_index()
// ============================================================================

import type {
  AliasEntry,
  CanonicalData,
  EntityType,
  ParsedProductName,
  ResolutionMethod,
  ResolutionResult,
} from './types';
import { normalize, parseProductName } from './parser';

// ── Confidence scores by resolution method ──

const CONFIDENCE: Record<ResolutionMethod, number> = {
  direct: 0.95,
  strip_the: 0.95,
  add_the: 0.95,
  botanical_fallback: 0.85,
  botanical_match: 0.85,
  raw_match: 0.75,
  species_keyword: 0.80,
  generic_default: 0.50,
  word_match: 0.60,
  bigram_match: 0.80,
  trigram_match: 0.80,
  none: 0.0,
};

// ── Species keyword map ──

const SPECIES_KEYWORDS: Record<string, { id: string; name: string }> = {
  american: { id: 'pe_corylus_americana', name: 'American Hazelnut' },
  beaked: { id: 'pe_corylus_cornuta', name: 'Beaked Hazelnut' },
  chilean: { id: 'pe_gevuina_avellana', name: 'Chilean Hazelnut' },
  european: { id: 'pe_corylus_avellana', name: 'European Hazelnut' },
  turkish: { id: 'pe_corylus_colurna', name: 'Turkish Tree Hazel' },
};

/**
 * Build an alias index from canonical entity data (JSON file or Supabase query).
 *
 * The index maps normalized text → AliasEntry, covering:
 * - Canonical names of cultivars, named materials, populations, plant entities
 * - All aliases (including parsed versions of aliases)
 * - Botanical names of plant entities
 */
export function buildAliasIndex(canonical: CanonicalData): Map<string, AliasEntry> {
  const index = new Map<string, AliasEntry>();

  function addEntry(normKey: string, entry: AliasEntry) {
    if (normKey && !index.has(normKey)) {
      index.set(normKey, entry);
    }
  }

  // ── Index cultivars ──
  for (const cv of canonical.cultivars ?? []) {
    const norm = normalize(cv.canonical_name);
    addEntry(norm, {
      entityType: 'cultivar',
      entityId: cv.id,
      canonicalName: cv.canonical_name,
      matchSource: 'canonical_name',
    });

    for (const alias of cv.aliases ?? []) {
      const normAlias = normalize(alias);
      addEntry(normAlias, {
        entityType: 'cultivar',
        entityId: cv.id,
        canonicalName: cv.canonical_name,
        matchSource: `alias: ${alias}`,
      });

      // Also index the PARSED version of each alias
      const parsed = parseProductName(alias);
      const normParsed = normalize(parsed.coreName);
      if (normParsed) {
        addEntry(normParsed, {
          entityType: 'cultivar',
          entityId: cv.id,
          canonicalName: cv.canonical_name,
          matchSource: `parsed_alias: ${alias}`,
        });
      }
    }
  }

  // ── Index named materials ──
  for (const nm of canonical.named_materials ?? []) {
    const norm = normalize(nm.canonical_name);
    addEntry(norm, {
      entityType: 'named_material',
      entityId: nm.id,
      canonicalName: nm.canonical_name,
      matchSource: 'canonical_name',
    });

    for (const alias of nm.aliases ?? []) {
      const normAlias = normalize(alias);
      addEntry(normAlias, {
        entityType: 'named_material',
        entityId: nm.id,
        canonicalName: nm.canonical_name,
        matchSource: `alias: ${alias}`,
      });

      const parsed = parseProductName(alias);
      const normParsed = normalize(parsed.coreName);
      if (normParsed) {
        addEntry(normParsed, {
          entityType: 'named_material',
          entityId: nm.id,
          canonicalName: nm.canonical_name,
          matchSource: `parsed_alias: ${alias}`,
        });
      }
    }
  }

  // ── Index populations ──
  for (const pop of canonical.populations ?? []) {
    const norm = normalize(pop.canonical_name);
    addEntry(norm, {
      entityType: 'population',
      entityId: pop.id,
      canonicalName: pop.canonical_name,
      matchSource: 'canonical_name',
    });

    for (const alias of pop.aliases ?? []) {
      const normAlias = normalize(alias);
      addEntry(normAlias, {
        entityType: 'population',
        entityId: pop.id,
        canonicalName: pop.canonical_name,
        matchSource: `alias: ${alias}`,
      });

      const parsed = parseProductName(alias);
      const normParsed = normalize(parsed.coreName);
      if (normParsed) {
        addEntry(normParsed, {
          entityType: 'population',
          entityId: pop.id,
          canonicalName: pop.canonical_name,
          matchSource: `parsed_alias: ${alias}`,
        });
      }
    }
  }

  // ── Index plant entities ──
  for (const pe of canonical.plant_entities ?? []) {
    const norm = normalize(pe.canonical_name);
    addEntry(norm, {
      entityType: 'plant_entity',
      entityId: pe.id,
      canonicalName: pe.canonical_name,
      matchSource: 'canonical_name',
    });

    for (const alias of pe.common_aliases ?? []) {
      const normAlias = normalize(alias);
      addEntry(normAlias, {
        entityType: 'plant_entity',
        entityId: pe.id,
        canonicalName: pe.canonical_name,
        matchSource: `alias: ${alias}`,
      });
    }

    // Index botanical name
    if (pe.botanical_name) {
      const normBot = normalize(pe.botanical_name);
      addEntry(normBot, {
        entityType: 'plant_entity',
        entityId: pe.id,
        canonicalName: pe.canonical_name,
        matchSource: `botanical: ${pe.botanical_name}`,
      });
    }
  }

  return index;
}

/**
 * Resolve a parsed product name against the alias index.
 * Tries match strategies in priority order (highest confidence first).
 */
export function resolveEntity(
  parsed: ParsedProductName,
  aliasIndex: Map<string, AliasEntry>,
  canonical: CanonicalData
): ResolutionResult {
  const normCore = normalize(parsed.coreName);

  function hit(method: ResolutionMethod, entry: AliasEntry): ResolutionResult {
    return {
      resolved: true,
      method,
      confidence: CONFIDENCE[method],
      entityType: entry.entityType,
      entityId: entry.entityId,
      canonicalName: entry.canonicalName,
      matchSource: entry.matchSource,
    };
  }

  // 1. Direct match
  const direct = aliasIndex.get(normCore);
  if (direct) return hit('direct', direct);

  // 2. Strip "the" prefix
  if (normCore.startsWith('the ')) {
    const withoutThe = aliasIndex.get(normCore.slice(4));
    if (withoutThe) return hit('strip_the', withoutThe);
  }

  // 3. Add "the" prefix
  const withThe = aliasIndex.get('the ' + normCore);
  if (withThe) return hit('add_the', withThe);

  // 4. Botanical name match (conservative — only if core is empty/generic)
  if (parsed.botanicalExtracted) {
    const normBot = normalize(parsed.botanicalExtracted);
    const botMatch = aliasIndex.get(normBot);
    if (botMatch && (!normCore || ['', 'seedling', 'seeds', 'sdlg'].includes(normCore))) {
      return hit('botanical_fallback', botMatch);
    }
  }

  // 5. Full raw name match
  const normRaw = normalize(parsed.raw);
  const rawMatch = aliasIndex.get(normRaw);
  if (rawMatch) return hit('raw_match', rawMatch);

  // 6. Botanical match (aggressive — even with partial core name)
  if (parsed.botanicalExtracted) {
    const normBot = normalize(parsed.botanicalExtracted);
    const botMatch = aliasIndex.get(normBot);
    if (botMatch) return hit('botanical_match', botMatch);
  }

  // 7. Species keyword match
  if (normCore in SPECIES_KEYWORDS) {
    const sp = SPECIES_KEYWORDS[normCore];
    return {
      resolved: true,
      method: 'species_keyword',
      confidence: CONFIDENCE.species_keyword,
      entityType: 'plant_entity',
      entityId: sp.id,
      canonicalName: sp.name,
      matchSource: `species_keyword: ${normCore}`,
    };
  }

  // 8. Generic/empty core → default to C. avellana
  if (!normCore || ['', 'seedling', 'seeds', 'sdlg'].includes(normCore)) {
    return {
      resolved: true,
      method: 'generic_default',
      confidence: CONFIDENCE.generic_default,
      entityType: 'plant_entity',
      entityId: 'pe_corylus_avellana',
      canonicalName: 'European Hazelnut',
      matchSource: 'generic hazelnut default',
    };
  }

  // 9. Word match — try each word individually
  const words = normCore.split(' ');
  const stopWords = new Set(['the', 'and', 'for', 'old', 'new', 'per']);
  for (const word of words) {
    if (word.length > 2 && !stopWords.has(word)) {
      const wordMatch = aliasIndex.get(word);
      if (wordMatch) return hit('word_match', wordMatch);
    }
  }

  // 10. Bigram match
  if (words.length >= 2) {
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i + 1];
      const bigramMatch = aliasIndex.get(bigram);
      if (bigramMatch) return hit('bigram_match', bigramMatch);
    }
  }

  // 11. Trigram match
  if (words.length >= 3) {
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
      const trigramMatch = aliasIndex.get(trigram);
      if (trigramMatch) return hit('trigram_match', trigramMatch);
    }
  }

  // 12. Unresolved
  return {
    resolved: false,
    method: 'none',
    confidence: 0,
    entityType: 'unresolved',
    entityId: null,
    canonicalName: null,
    matchSource: null,
  };
}

/**
 * Map entity type to resolution_status enum value.
 */
export function toResolutionStatus(entityType: EntityType): ResolutionResult['method'] extends string
  ? string
  : never {
  const map: Record<EntityType, string> = {
    cultivar: 'resolved_cultivar',
    named_material: 'resolved_named_material',
    population: 'resolved_population',
    plant_entity: 'resolved_plant_entity',
    unresolved: 'unresolved',
  };
  return map[entityType] as any;
}
