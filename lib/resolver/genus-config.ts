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

// ── Registry ──

const GENUS_REGISTRY: Record<string, GenusConfig> = {
  corylus: {
    genusKey: 'corylus',
    displayName: 'Hazelnuts',
    parserConfig: DEFAULT_PARSER_CONFIG,
    resolverConfig: DEFAULT_RESOLVER_CONFIG,
  },
  // To add walnuts:
  // juglans: {
  //   genusKey: 'juglans',
  //   displayName: 'Walnuts',
  //   parserConfig: WALNUT_PARSER_CONFIG,   // import from walnut-config.ts
  //   resolverConfig: WALNUT_RESOLVER_CONFIG,
  // },
};

export function getGenusConfig(key: string): GenusConfig | null {
  return GENUS_REGISTRY[key] ?? null;
}

export function listSupportedGenera(): string[] {
  return Object.keys(GENUS_REGISTRY);
}
