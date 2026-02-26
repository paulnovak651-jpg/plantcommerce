// ============================================================================
// Product Name Parser
// Decomposes raw nursery product names into structured components.
// Port of resolver_test.py parse_product_name()
// ============================================================================

import type { ParsedProductName } from './types';
import { DEFAULT_PARSER_CONFIG, type ParserConfig } from './parser-config';

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
export function parseProductName(
  rawName: string,
  config: ParserConfig = DEFAULT_PARSER_CONFIG
): ParsedProductName {
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

  // Extract botanical name in parentheses (config-driven).
  for (const configuredPattern of config.botanicalPatterns) {
    const pattern = cloneRegex(configuredPattern);
    const botanical = working.match(pattern);
    if (!botanical) continue;

    result.botanicalExtracted = (botanical[1] ?? botanical[0])
      .replace(/[()]/g, '')
      .trim();
    working =
      working.slice(0, botanical.index!) +
      working.slice(botanical.index! + botanical[0].length);
    break;
  }

  // Extract patent info.
  const patent = working.match(/(US[\s-]*PP?\s*[\d,]+[\s-]*P?\d*)/);
  if (patent) {
    result.patentInfo = patent[1].trim();
    working =
      working.slice(0, patent.index!) +
      working.slice(patent.index! + patent[0].length);
  }

  const uspp = working.match(/(USPP\s*[\d,]+)/);
  if (uspp) {
    result.patentInfo = uspp[1].trim();
    working =
      working.slice(0, uspp.index!) +
      working.slice(uspp.index! + uspp[0].length);
  }

  // Detect and remove trademark symbols.
  if (/[™®]|\(TM\)/.test(working)) {
    result.trademarkFound = true;
    working = working.replace(/[™®]/g, '');
    working = working.replace(/\(TM\)/g, '');
    working = working.replace(/\bTM\b/g, '');
  }

  // Extract organic/conventional status.
  const organic = working.match(
    /\((Organic|organic|Conventional|conventional)\)/
  );
  if (organic) {
    result.organicStatus = organic[1].toLowerCase() as
      | 'organic'
      | 'conventional';
    working =
      working.slice(0, organic.index!) +
      working.slice(organic.index! + organic[0].length);
  }

  // Extract age/size info.
  const age1 = working.match(
    /[-–]\s*(\d[\d\-'"]*\s*(?:year|yr|Yr)[\s.\-]*(?:old|Old)?)/
  );
  if (age1) {
    result.ageSize = age1[1].trim();
    working = working.slice(0, age1.index!) + working.slice(age1.index! + age1[0].length);
  }

  const age2 = working.match(/[-–]\s*(\d+\s+year\s+old)\s*[-–]?/i);
  if (age2) {
    result.ageSize = age2[1].trim();
    working = working.slice(0, age2.index!) + working.slice(age2.index! + age2[0].length);
  }

  // Extract propagation method (config-driven).
  for (const { pattern: configuredPattern, method } of config.propagationPatterns) {
    const pattern = cloneRegex(configuredPattern);
    if (pattern.test(working)) {
      result.propagationMethod = method;
      const match = working.match(pattern)!;
      result.strippedTokens.push(match[0]);
      working = working.replace(pattern, '');
      break;
    }
  }

  // Extract sale form (config-driven).
  for (const { pattern: configuredPattern, form } of config.saleFormPatterns) {
    const pattern = cloneRegex(configuredPattern);
    if (pattern.test(working)) {
      result.saleForm = form;
      const match = working.match(pattern)!;
      result.strippedTokens.push(match[0]);
      working = working.replace(pattern, '');
      break;
    }
  }

  // Strip plant type noise terms (config-driven, order matters).
  for (const configuredPattern of config.noiseTerms) {
    const pattern = cloneRegex(configuredPattern);
    const match = working.match(pattern);
    if (match) {
      result.strippedTokens.push(...match);
      working = working.replace(pattern, '');
    }
  }

  // Strip marketing text after long dash.
  const marketing = working.match(/\s*[-–]\s*[A-Z][a-z].*$/);
  if (marketing && marketing[0].length > 20) {
    result.marketingText = marketing[0].replace(/^[\s\-–]+/, '');
    working = working.slice(0, marketing.index!);
  }

  // Strip nickname text (config-driven) — matched text is saved as marketingText.
  for (const configuredPattern of config.nicknamePatterns ?? []) {
    const pattern = cloneRegex(configuredPattern);
    const match = working.match(pattern);
    if (match) {
      result.marketingText = match[0].replace(/^["\s]+|["\s]+$/g, '');
      working =
        working.slice(0, match.index!) +
        working.slice(match.index! + match[0].length);
      break;
    }
  }

  // Strip suffix text patterns (config-driven) — trailing noise, stripped silently.
  for (const configuredPattern of config.suffixStripPatterns ?? []) {
    const pattern = cloneRegex(configuredPattern);
    const match = working.match(pattern);
    if (match) {
      working = working.slice(0, match.index!);
      break;
    }
  }

  // Strip slash compound names: keep first part.
  const slash = working.match(/\s*\/\s*.*$/);
  if (slash) {
    working = working.slice(0, slash.index!);
  }

  // Strip "(cultivar)" text.
  working = working.replace(/\(cultivar\)/gi, '');

  // Clean up.
  working = working.replace(/^[\s,\-–]+|[\s,\-–]+$/g, '');
  working = working.replace(/[''ʼ']/g, '');
  working = working.replace(/\s+/g, ' ').trim();

  result.coreName = working;
  return result;
}

function cloneRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags);
}
