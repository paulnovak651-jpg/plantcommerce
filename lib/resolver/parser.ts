// ============================================================================
// Product Name Parser
// Decomposes raw nursery product names into structured components.
// Port of resolver_test.py parse_product_name()
// ============================================================================

import type { ParsedProductName, PropagationMethod, SaleForm } from './types.js';

/**
 * Normalize text for matching: lowercase, strip symbols, collapse whitespace.
 */
export function normalize(text: string): string {
  if (!text) return '';
  let t = text.toLowerCase().trim();
  // Remove trademark/patent symbols
  t = t.replace(/[™®©]/g, '');
  // Remove single quotes (Grimo style: 'Gene', 'Alex')
  t = t.replace(/[''ʼ']/g, '');
  // Remove double quotes
  t = t.replace(/"/g, '');
  // Collapse whitespace
  t = t.replace(/\s+/g, ' ');
  return t.trim();
}

/**
 * Parse a raw nursery product name into its components.
 * Extracts botanical names, patent info, propagation method, sale form,
 * age/size, marketing text, and the remaining "core name" for resolution.
 */
export function parseProductName(rawName: string): ParsedProductName {
  const result: ParsedProductName = {
    raw: rawName,
    coreName: '',
    botanicalExtracted: null,
    propagationMethod: null,
    saleForm: null,
    organicStatus: null,
    ageSize: null,
    patentInfo: null,
    trademarkFound: false,
    marketingText: null,
    strippedTokens: [],
  };

  let working = rawName;

  // ── Extract botanical name in parentheses ──
  const corylus = working.match(/\(([Cc]orylus\s+[\w\s×x]+?)\)/);
  if (corylus) {
    result.botanicalExtracted = corylus[1].trim();
    working = working.slice(0, corylus.index!) + working.slice(corylus.index! + corylus[0].length);
  }

  const gevuina = working.match(/\(Gevuina\s+avellana\)/);
  if (gevuina) {
    result.botanicalExtracted = gevuina[0].replace(/[()]/g, '');
    working = working.slice(0, gevuina.index!) + working.slice(gevuina.index! + gevuina[0].length);
  }

  // ── Extract patent info ──
  const patent = working.match(/(US[\s-]*PP?\s*[\d,]+[\s-]*P?\d*)/);
  if (patent) {
    result.patentInfo = patent[1].trim();
    working = working.slice(0, patent.index!) + working.slice(patent.index! + patent[0].length);
  }

  const uspp = working.match(/(USPP\s*[\d,]+)/);
  if (uspp) {
    result.patentInfo = uspp[1].trim();
    working = working.slice(0, uspp.index!) + working.slice(uspp.index! + uspp[0].length);
  }

  // ── Detect and remove trademark symbols ──
  if (/[™®]|\(TM\)/.test(working)) {
    result.trademarkFound = true;
    working = working.replace(/[™®]/g, '');
    working = working.replace(/\(TM\)/g, '');
    working = working.replace(/\bTM\b/g, '');
  }

  // ── Extract organic/conventional status ──
  const organic = working.match(/\((Organic|organic|Conventional|conventional)\)/);
  if (organic) {
    result.organicStatus = organic[1].toLowerCase() as 'organic' | 'conventional';
    working = working.slice(0, organic.index!) + working.slice(organic.index! + organic[0].length);
  }

  // ── Extract age/size info ──
  const age1 = working.match(/[-–]\s*(\d[\d\-'"]*\s*(?:year|yr|Yr)[\s.\-]*(?:old|Old)?)/);
  if (age1) {
    result.ageSize = age1[1].trim();
    working = working.slice(0, age1.index!) + working.slice(age1.index! + age1[0].length);
  }

  const age2 = working.match(/[-–]\s*(\d+\s+year\s+old)\s*[-–]?/i);
  if (age2) {
    result.ageSize = age2[1].trim();
    working = working.slice(0, age2.index!) + working.slice(age2.index! + age2[0].length);
  }

  // ── Extract propagation method ──
  const propPatterns: [RegExp, PropagationMethod][] = [
    [/\bHazel Layer(?:ed)?\b/, 'layered_clone'],
    [/\bGrafted\b/, 'grafted'],
    [/\b[Ss]eedling\b/, 'seedling'],
    [/\b[Ss]dlg\b/, 'seedling'],
    [/\b[Ss]eeds?\b/, 'seed'],
    [/\b[Tt]ubelings?\b/, 'unknown'], // tubelings → propagation unknown, sale_form = tubeling
    [/\btissue cultured\b/i, 'tissue_cultured'],
  ];

  for (const [pattern, method] of propPatterns) {
    if (pattern.test(working)) {
      result.propagationMethod = method;
      const match = working.match(pattern)!;
      result.strippedTokens.push(match[0]);
      working = working.replace(pattern, '');
      break;
    }
  }

  // ── Extract sale form ──
  const salePatterns: [RegExp, SaleForm][] = [
    [/\bBare[\s-]?[Rr]oot\b/, 'bare_root'],
    [/\bpotted\b/i, 'potted'],
    [/\b[Tt]ubelings?\b/, 'tubeling'],
    [/\bplug\b/i, 'plug'],
    [/\bcontainer\b/i, 'container'],
  ];

  for (const [pattern, form] of salePatterns) {
    if (pattern.test(working)) {
      result.saleForm = form;
      const match = working.match(pattern)!;
      result.strippedTokens.push(match[0]);
      working = working.replace(pattern, '');
      break;
    }
  }

  // ── Strip plant type noise terms (order matters — longest first) ──
  const noiseTerms = [
    /\bFilbert\s+Hazelnut\s+Tree\b/gi,
    /\bHazelnut\s+Tree\b/gi,
    /\bFilbert\s+Tree\b/gi,
    /\bHazelnut\s+Cultivar\b/gi,
    /\bHazel\s+Cultivar\b/gi,
    /\bFilbert\s+Hazelnut\b/gi,
    /\bHazelnut\b/gi,
    /\bHAZELNUT\b/g,
    /\bFilbert\b/gi,
    /\bFILBERT\b/g,
    /\bHazel\b/gi,
    /\bHAZEL\b/g,
    /\bTree\b/gi,
    // NOTE: "Cultivar" intentionally NOT stripped — it's a name at Z's Nutty Ridge
  ];

  for (const pattern of noiseTerms) {
    const match = working.match(pattern);
    if (match) {
      result.strippedTokens.push(...match);
      working = working.replace(pattern, '');
    }
  }

  // ── Strip marketing text after long dash ──
  const marketing = working.match(/\s*[-–]\s*[A-Z][a-z].*$/);
  if (marketing && marketing[0].length > 20) {
    result.marketingText = marketing[0].replace(/^[\s\-–]+/, '');
    working = working.slice(0, marketing.index!);
  }

  // ── Strip "The Crazy Productive One" nickname ──
  const nickname = working.match(/["\s]*The\s+Crazy\s+Productive\s+One["\s]*/);
  if (nickname) {
    result.marketingText = 'The Crazy Productive One';
    working = working.slice(0, nickname.index!) + working.slice(nickname.index! + nickname[0].length);
  }

  // ── Strip informal text: "We now have..." ──
  const informal = working.match(/We now have.*$/);
  if (informal) {
    working = working.slice(0, informal.index!);
  }

  // ── Strip "Start your own orchard" type suffixes ──
  const suffix = working.match(/[-–]\s*Start\s+your\s+.*$/i);
  if (suffix) {
    working = working.slice(0, suffix.index!);
  }

  // ── Strip remaining (Filbert) parenthetical ──
  working = working.replace(/\((Filbert|filbert)\)/g, '');

  // ── Strip slash compound names: keep first part ──
  const slash = working.match(/\s*\/\s*.*$/);
  if (slash) {
    working = working.slice(0, slash.index!);
  }

  // ── Strip "(cultivar)" text ──
  working = working.replace(/\(cultivar\)/gi, '');

  // ── Clean up ──
  // Strip leading/trailing dashes, spaces, commas
  working = working.replace(/^[\s,\-–]+|[\s,\-–]+$/g, '');
  // Remove single quotes (Grimo-style)
  working = working.replace(/[''ʼ']/g, '');
  // Strip "Medium/Short Bush" descriptors
  working = working.replace(/,?\s*Medium\/Short Bush/g, '');
  // Collapse whitespace
  working = working.replace(/\s+/g, ' ').trim();

  result.coreName = working;
  return result;
}
