import type { PropagationMethod, SaleForm } from './types';

export interface PropagationPattern {
  pattern: RegExp;
  method: PropagationMethod;
}

export interface SaleFormPattern {
  pattern: RegExp;
  form: SaleForm;
}

export interface ParserConfig {
  botanicalPatterns: RegExp[];
  propagationPatterns: PropagationPattern[];
  saleFormPatterns: SaleFormPattern[];
  noiseTerms: RegExp[];
  /** Patterns for product nicknames — matched text is saved as marketingText. */
  nicknamePatterns?: RegExp[];
  /** Patterns for trailing text that should be stripped silently. */
  suffixStripPatterns?: RegExp[];
}

export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  // Genus-agnostic botanical extraction from parenthetical Latin names.
  // Examples:
  // - (Corylus avellana)
  // - (Gevuina avellana)
  // - (Castanea sativa)
  botanicalPatterns: [
    /\(([A-Z][a-z]+(?:\s+[A-Za-z][A-Za-z×x-]*){1,4})\)/,
  ],

  propagationPatterns: [
    { pattern: /\bHazel Layer(?:ed)?\b/, method: 'layered_clone' },
    { pattern: /\bGrafted\b/, method: 'grafted' },
    { pattern: /\b[Ss]eedling\b/, method: 'seedling' },
    { pattern: /\b[Ss]dlg\b/, method: 'seedling' },
    { pattern: /\b[Ss]eeds?\b/, method: 'seed' },
    { pattern: /\b[Tt]ubelings?\b/, method: 'unknown' },
    { pattern: /\btissue cultured\b/i, method: 'tissue_cultured' },
  ],

  saleFormPatterns: [
    { pattern: /\bBare[\s-]?[Rr]oot\b/, form: 'bare_root' },
    { pattern: /\bpotted\b/i, form: 'potted' },
    { pattern: /\b[Tt]ubelings?\b/, form: 'tubeling' },
    { pattern: /\bplug\b/i, form: 'plug' },
    { pattern: /\bcontainer\b/i, form: 'container' },
  ],

  // Config-first list so new genus/family noise can be added here
  // instead of hardcoding parser logic.
  noiseTerms: [
    /\bFilbert\s+Hazelnut\s+Tree\b/gi,
    /\bHazelnut\s+Tree\b/gi,
    /\bFilbert\s+Tree\b/gi,
    /\bHazelnut\s+Cultivar\b/gi,
    /\bHazel\s+Cultivar\b/gi,
    /\bFilbert\s+Hazelnut\b/gi,
    /\bHazelnut\b/gi,
    /\bHAZELNUT\b/g,
    /\(Filbert\)/gi,            // parenthetical form — must precede bare \bFilbert\b
    /\bFilbert\b/gi,
    /\bFILBERT\b/g,
    /\bHazel\b/gi,
    /\bHAZEL\b/g,
    /\bTree\b/gi,
    // NOTE: "Cultivar" intentionally not stripped; valid name token at Z's.
    /,?\s*Medium\/Short Bush/g, // Grimo growth habit descriptor
  ],
  nicknamePatterns: [
    /["\s]*The\s+Crazy\s+Productive\s+One["\s]*/,
  ],
  suffixStripPatterns: [
    /We now have.*$/,
    /[-–]\s*Start\s+your\s+.*$/i,
  ],
};
