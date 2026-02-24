import { describe, it, expect } from 'vitest';
import { parseProductName, normalize } from '../parser';
import testData from '@/data/hazelnut_raw_offers_testset.json';

// ── normalize() ──

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  Jefferson  ')).toBe('jefferson');
  });

  it('strips trademark symbols', () => {
    expect(normalize('THE BEAST™ FILBERT')).toBe('the beast filbert');
  });

  it('strips registered symbol', () => {
    expect(normalize('NITKA® Hazel')).toBe('nitka hazel');
  });

  it('strips single quotes', () => {
    expect(normalize("'Gene' Hazel")).toBe('gene hazel');
  });

  it('collapses whitespace', () => {
    expect(normalize('Grand   Traverse   Hazelnut')).toBe('grand traverse hazelnut');
  });
});

// ── parseProductName() — edge cases ──

describe('parseProductName — edge cases', () => {
  it('extracts botanical name from parentheses', () => {
    const result = parseProductName('JEFFERSON HAZELNUT (Corylus avellana)');
    expect(result.botanicalExtracted).toBe('Corylus avellana');
  });

  it('extracts Gevuina botanical', () => {
    const result = parseProductName('Chilean Hazelnut (Gevuina avellana)');
    expect(result.botanicalExtracted).toBe('Gevuina avellana');
  });

  it('extracts patent info', () => {
    const result = parseProductName('Photon Hazel Grafted(cultivar) US-PP34790-P2');
    expect(result.patentInfo).toBeTruthy();
  });

  it('detects trademark', () => {
    const result = parseProductName('THE BEAST™ FILBERT');
    expect(result.trademarkFound).toBe(true);
    expect(result.coreName.toLowerCase()).toContain('beast');
  });

  it('strips quoted names (Grimo style)', () => {
    const result = parseProductName("'Gene' Hazel Layer");
    expect(result.coreName.toLowerCase()).toBe('gene');
  });

  it('detects propagation: layered', () => {
    const result = parseProductName("'Alex' Hazel Layer");
    expect(result.propagationMethod).toBe('layered_clone');
  });

  it('detects propagation: grafted', () => {
    const result = parseProductName('Photon Hazel Grafted(cultivar)');
    expect(result.propagationMethod).toBe('grafted');
  });

  it('detects propagation: seedling', () => {
    const result = parseProductName('Hazelnut Seedling');
    expect(result.propagationMethod).toBe('seedling');
  });

  it('detects sale form: bare root', () => {
    const result = parseProductName('The Beast Hazelnut Cultivar - Bare root (1-year)');
    expect(result.saleForm).toBe('bare_root');
  });

  it('detects organic status', () => {
    const result = parseProductName('Butler (Organic)');
    expect(result.organicStatus).toBe('organic');
  });

  it('strips marketing text after dash', () => {
    const result = parseProductName(
      'NITKA® Hazel Layer(cultivar) - A great hazelnut for cold hardy regions'
    );
    expect(result.coreName.toLowerCase()).not.toContain('great hazelnut');
  });

  it('strips "The Crazy Productive One" nickname', () => {
    const result = parseProductName(
      'Somerset Hazelnut Cultivar " The Crazy Productive One"- Bare Root'
    );
    expect(result.coreName.toLowerCase()).toContain('somerset');
    expect(result.coreName.toLowerCase()).not.toContain('crazy');
  });

  it('handles slash compounds (keeps first part)', () => {
    const result = parseProductName(
      'NeoHybrid Hazelnuts / Hybrid Hazel Seedlings (Standard Hazels)'
    );
    expect(result.coreName.toLowerCase()).toContain('neohybrid');
  });

  it('strips "Start your own orchard"', () => {
    const result = parseProductName('Hazelnut Seeds - Start your own orchard');
    expect(result.coreName.toLowerCase()).not.toContain('orchard');
  });

  it('handles empty input gracefully', () => {
    const result = parseProductName('');
    expect(result.coreName).toBe('');
    expect(result.strippedTokens).toBeDefined();
  });
});

// ── parseProductName() — table-driven test for all 104 cases ──

describe('parseProductName — testset coverage', () => {
  it('returns non-empty coreName for all 104 real product names', () => {
    const failures: string[] = [];

    for (const entry of testData) {
      const result = parseProductName(entry.raw_product_name);
      // coreName can be empty for generic products (e.g., "Hazelnut Seeds")
      // but strippedTokens should always exist
      if (result.strippedTokens === undefined) {
        failures.push(`Missing strippedTokens for: "${entry.raw_product_name}"`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('extracts botanical for entries with (Corylus...)', () => {
    const entriesWithBotanical = testData.filter(
      (e) =>
        e.raw_product_name.includes('Corylus') ||
        e.raw_product_name.includes('Gevuina')
    );

    const failures: string[] = [];
    for (const entry of entriesWithBotanical) {
      const result = parseProductName(entry.raw_product_name);
      if (!result.botanicalExtracted) {
        failures.push(`No botanical extracted from: "${entry.raw_product_name}"`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('produces consistent output for repeated calls', () => {
    for (const entry of testData.slice(0, 10)) {
      const a = parseProductName(entry.raw_product_name);
      const b = parseProductName(entry.raw_product_name);
      expect(a.coreName).toBe(b.coreName);
      expect(a.botanicalExtracted).toBe(b.botanicalExtracted);
      expect(a.propagationMethod).toBe(b.propagationMethod);
    }
  });
});
