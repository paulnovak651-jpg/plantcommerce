// ============================================================================
// Genus Config Registry
// Bundles ParserConfig + ResolverConfig into a single per-genus unit.
// Adding a new genus means: create a GenusConfig object, add to GENUS_REGISTRY.
// ============================================================================

import { DEFAULT_PARSER_CONFIG, type ParserConfig } from './parser-config';
import { DEFAULT_RESOLVER_CONFIG, type ResolverConfig } from './resolver-config';

export interface GenusConfig {
  /** Lowercase genus identifier, e.g. 'corylus', 'juglans', 'castanea' */
  genusKey: string;
  /** Human-readable plural label, e.g. 'Hazelnuts', 'Walnuts' */
  displayName: string;
  parserConfig: ParserConfig;
  resolverConfig: ResolverConfig;
}

// ── Malus (Apple) ──

const MALUS_PARSER_CONFIG: ParserConfig = {
  botanicalPatterns: DEFAULT_PARSER_CONFIG.botanicalPatterns,
  propagationPatterns: [
    { pattern: /\bGrafted\b/i, method: 'grafted' },
    { pattern: /\b[Ss]eedling\b/, method: 'seedling' },
    { pattern: /\b[Ss]dlg\b/, method: 'seedling' },
    { pattern: /\b[Ss]eeds?\b/, method: 'seed' },
    { pattern: /\btissue cultured\b/i, method: 'tissue_cultured' },
  ],
  saleFormPatterns: DEFAULT_PARSER_CONFIG.saleFormPatterns,
  noiseTerms: [
    /\bApple\s+Tree\b/gi,
    /\bApple\b/gi,
    /\bTree\b/gi,
    /\bDwarf\b/gi,
    /\bSemi[-\s]?Dwarf\b/gi,
    /\bStandard\b/gi,
    /\bSpur\b/gi,
    // Rootstock extraction — strip rootstock tokens from cultivar names
    /\b(?:on\s+)?(?:M[.-]?(?:7|9|26|27|111)|MM[.-]?(?:106|111)|G[.-]?(?:11|41|890|935)|B[.-]?(?:9|10)|Antonovka)\b/gi,
  ],
};

const MALUS_RESOLVER_CONFIG: ResolverConfig = {
  speciesKeywords: {
    crabapple: ['crabapple', 'malus species'],
    'crab apple': ['crabapple', 'malus species'],
  },
  genericDefaultCandidates: ['apple', 'malus domestica'],
};

// ── Prunus (Stone Fruit) ──

const PRUNUS_PARSER_CONFIG: ParserConfig = {
  botanicalPatterns: DEFAULT_PARSER_CONFIG.botanicalPatterns,
  propagationPatterns: [
    { pattern: /\bGrafted\b/i, method: 'grafted' },
    { pattern: /\b[Ss]eedling\b/, method: 'seedling' },
    { pattern: /\b[Ss]dlg\b/, method: 'seedling' },
    { pattern: /\b[Ss]eeds?\b/, method: 'seed' },
    { pattern: /\btissue cultured\b/i, method: 'tissue_cultured' },
  ],
  saleFormPatterns: DEFAULT_PARSER_CONFIG.saleFormPatterns,
  noiseTerms: [
    /\bCherry\s+Tree\b/gi,
    /\bPlum\s+Tree\b/gi,
    /\bPeach\s+Tree\b/gi,
    /\bCherry\b/gi,
    /\bPlum\b/gi,
    /\bPeach\b/gi,
    /\bApricot\b/gi,
    /\bNectarine\b/gi,
    /\bTree\b/gi,
    // Rootstock extraction
    /\b(?:on\s+)?(?:Lovell|Nemaguard|Citation|Krymsk(?:\s*\d+)?|Myrobalan|Mazzard|Mahaleb|Gisela(?:\s*\d+)?)\b/gi,
  ],
};

const PRUNUS_RESOLVER_CONFIG: ResolverConfig = {
  speciesKeywords: {
    nanking: ['nanking cherry', 'prunus tomentosa'],
    'beach plum': ['beach plum', 'prunus maritima'],
    'sand cherry': ['sand cherry', 'prunus besseyi'],
  },
  genericDefaultCandidates: ['cherry', 'prunus species'],
};

// ── Pyrus (Pear) ──

const PYRUS_PARSER_CONFIG: ParserConfig = {
  botanicalPatterns: DEFAULT_PARSER_CONFIG.botanicalPatterns,
  propagationPatterns: [
    { pattern: /\bGrafted\b/i, method: 'grafted' },
    { pattern: /\b[Ss]eedling\b/, method: 'seedling' },
    { pattern: /\b[Ss]dlg\b/, method: 'seedling' },
    { pattern: /\b[Ss]eeds?\b/, method: 'seed' },
    { pattern: /\btissue cultured\b/i, method: 'tissue_cultured' },
  ],
  saleFormPatterns: DEFAULT_PARSER_CONFIG.saleFormPatterns,
  noiseTerms: [
    /\bPear\s+Tree\b/gi,
    /\bPear\b/gi,
    /\bTree\b/gi,
    /\bDwarf\b/gi,
    /\bSemi[-\s]?Dwarf\b/gi,
    /\bStandard\b/gi,
    // Rootstock extraction
    /\b(?:on\s+)?(?:OHxF\s*(?:87|97|333|513)|Callery|Betulifolia|Pyrus\s+calleryana)\b/gi,
  ],
};

const PYRUS_RESOLVER_CONFIG: ResolverConfig = {
  speciesKeywords: {
    'asian pear': ['asian pear', 'pyrus pyrifolia'],
    'european pear': ['european pear', 'pyrus communis'],
  },
  genericDefaultCandidates: ['pear', 'pyrus communis'],
};

// ── Vitis (Grape) ──

const VITIS_PARSER_CONFIG: ParserConfig = {
  botanicalPatterns: DEFAULT_PARSER_CONFIG.botanicalPatterns,
  propagationPatterns: [
    { pattern: /\bGrafted\b/i, method: 'grafted' },
    { pattern: /\b[Ss]eedling\b/, method: 'seedling' },
    { pattern: /\b[Ss]eeds?\b/, method: 'seed' },
    { pattern: /\b[Cc]utting\b/, method: 'unknown' },
  ],
  saleFormPatterns: DEFAULT_PARSER_CONFIG.saleFormPatterns,
  noiseTerms: [
    /\bGrapevine\b/gi,
    /\bGrape\s+Vine\b/gi,
    /\bGrape\b/gi,
    /\bVine\b/gi,
    /\bMuscadine\b/gi,
  ],
};

const VITIS_RESOLVER_CONFIG: ResolverConfig = {
  speciesKeywords: {
    muscadine: ['muscadine grape', 'vitis rotundifolia'],
  },
  genericDefaultCandidates: ['grape', 'vitis vinifera'],
};

// ── Rubus (Raspberry/Blackberry) ──

const RUBUS_PARSER_CONFIG: ParserConfig = {
  botanicalPatterns: DEFAULT_PARSER_CONFIG.botanicalPatterns,
  propagationPatterns: [
    { pattern: /\btissue cultured\b/i, method: 'tissue_cultured' },
    { pattern: /\b[Ss]eedling\b/, method: 'seedling' },
    { pattern: /\b[Ss]eeds?\b/, method: 'seed' },
  ],
  saleFormPatterns: DEFAULT_PARSER_CONFIG.saleFormPatterns,
  noiseTerms: [
    /\bRaspberry\b/gi,
    /\bBlackberry\b/gi,
    /\bBramble\b/gi,
    /\bCane\b/gi,
    /\bPrimocane\b/gi,
    /\bFloricane\b/gi,
  ],
};

const RUBUS_RESOLVER_CONFIG: ResolverConfig = {
  speciesKeywords: {
    tayberry: ['tayberry', 'rubus hybrid'],
    boysenberry: ['boysenberry', 'rubus hybrid'],
    loganberry: ['loganberry', 'rubus hybrid'],
  },
  genericDefaultCandidates: ['raspberry', 'rubus idaeus'],
};

// ── Registry ──

const GENUS_REGISTRY: Record<string, GenusConfig> = {
  corylus: {
    genusKey: 'corylus',
    displayName: 'Hazelnuts',
    parserConfig: DEFAULT_PARSER_CONFIG,
    resolverConfig: DEFAULT_RESOLVER_CONFIG,
  },
  malus: {
    genusKey: 'malus',
    displayName: 'Apples',
    parserConfig: MALUS_PARSER_CONFIG,
    resolverConfig: MALUS_RESOLVER_CONFIG,
  },
  prunus: {
    genusKey: 'prunus',
    displayName: 'Stone Fruit',
    parserConfig: PRUNUS_PARSER_CONFIG,
    resolverConfig: PRUNUS_RESOLVER_CONFIG,
  },
  pyrus: {
    genusKey: 'pyrus',
    displayName: 'Pears',
    parserConfig: PYRUS_PARSER_CONFIG,
    resolverConfig: PYRUS_RESOLVER_CONFIG,
  },
  vitis: {
    genusKey: 'vitis',
    displayName: 'Grapes',
    parserConfig: VITIS_PARSER_CONFIG,
    resolverConfig: VITIS_RESOLVER_CONFIG,
  },
  rubus: {
    genusKey: 'rubus',
    displayName: 'Raspberries & Blackberries',
    parserConfig: RUBUS_PARSER_CONFIG,
    resolverConfig: RUBUS_RESOLVER_CONFIG,
  },
};

export function getGenusConfig(key: string): GenusConfig | null {
  return GENUS_REGISTRY[key] ?? null;
}

export function listSupportedGenera(): string[] {
  return Object.keys(GENUS_REGISTRY);
}
