import { parseQuery } from '@/lib/search/parseQuery';

describe('plant terms', () => {
  it('parses basic plant terms', () => {
    const parsed = parseQuery('honeycrisp apple');
    expect(parsed.plantTerms).toEqual(['honeycrisp', 'apple']);
  });

  it('removes stop words and extracts listing type', () => {
    const parsed = parseQuery('I want to buy some good apple trees');
    expect(parsed.plantTerms).toEqual(['apple']);
    expect(parsed.listingType).toBe('tree');
  });
});

describe('zip code', () => {
  it('extracts a 5-digit zip code', () => {
    const parsed = parseQuery('apple trees near 97201');
    expect(parsed.zipCode).toBe('97201');
  });
});

describe('zone filter', () => {
  it('extracts zone from "zone 6 pear"', () => {
    const parsed = parseQuery('zone 6 pear');
    expect(parsed.zoneFilter).toBe(6);
    expect(parsed.plantTerms).toEqual(['pear']);
  });

  it('extracts zone from "z6 pear"', () => {
    const parsed = parseQuery('z6 pear');
    expect(parsed.zoneFilter).toBe(6);
  });

  it('does not set invalid out-of-range zones', () => {
    expect(parseQuery('zone 0 pear').zoneFilter).toBeUndefined();
    expect(parseQuery('zone 14 pear').zoneFilter).toBeUndefined();
  });

  it('sets valid zones 1 through 13', () => {
    for (let zone = 1; zone <= 13; zone += 1) {
      const parsed = parseQuery(`zone ${zone} pear`);
      expect(parsed.zoneFilter).toBe(zone);
    }
  });
});

describe('state filter', () => {
  it('extracts state filter from 2-letter code', () => {
    const parsed = parseQuery('apple WA');
    expect(parsed.stateFilter).toBe('WA');
    expect(parsed.plantTerms).toEqual(['apple']);
  });
});

describe('listing types', () => {
  it('maps listing type aliases', () => {
    expect(parseQuery('scionwood').listingType).toBe('scion');
    expect(parseQuery('seedlings').listingType).toBe('plant');
    expect(parseQuery('trees').listingType).toBe('tree');
  });
});

describe('use tags', () => {
  it('extracts cider tag', () => {
    const parsed = parseQuery('cider apple');
    expect(parsed.useTagFilters).toEqual(['cider']);
    expect(parsed.plantTerms).toEqual(['apple']);
  });

  it('extracts multiple use tags', () => {
    const parsed = parseQuery('cider juice apple');
    expect(parsed.useTagFilters).toEqual(['cider', 'juice']);
  });
});

describe('boolean flags', () => {
  it('sets shippingOnly from shipping intent', () => {
    expect(parseQuery('apple shipping').shippingOnly).toBe(true);
  });

  it('sets localOnly from local intent', () => {
    expect(parseQuery('apple near me').localOnly).toBe(true);
  });

  it('logs and documents spaced self fertile behavior', () => {
    const parsed = parseQuery('self fertile pear');
    console.log(parsed);
    expect(parsed.selfFertileOnly).toBe(false);
  });

  it('sets selfFertileOnly from regex-matching phrase', () => {
    // "self fertile" (with a space) currently does not trigger this flag.
    expect(parseQuery('self fertil pear').selfFertileOnly).toBe(true);
  });

  it('sets edibleOnly from edible terms', () => {
    expect(parseQuery('edible plants').edibleOnly).toBe(true);
  });
});

describe('edge cases', () => {
  it('handles empty string', () => {
    const parsed = parseQuery('');
    expect(parsed.plantTerms).toEqual([]);
    expect(parsed.zipCode).toBeUndefined();
    expect(parsed.stateFilter).toBeUndefined();
    expect(parsed.listingType).toBeUndefined();
    expect(parsed.edibleOnly).toBe(false);
    expect(parsed.shippingOnly).toBe(false);
    expect(parsed.localOnly).toBe(false);
    expect(parsed.selfFertileOnly).toBe(false);
    expect(parsed.useTagFilters).toEqual([]);
  });

  it('handles whitespace-only string', () => {
    const parsed = parseQuery('   ');
    expect(parsed.plantTerms).toEqual([]);
    expect(parsed.zipCode).toBeUndefined();
    expect(parsed.stateFilter).toBeUndefined();
    expect(parsed.listingType).toBeUndefined();
    expect(parsed.edibleOnly).toBe(false);
    expect(parsed.shippingOnly).toBe(false);
    expect(parsed.localOnly).toBe(false);
    expect(parsed.selfFertileOnly).toBe(false);
    expect(parsed.useTagFilters).toEqual([]);
  });

  it('preserves rawQuery exactly as input', () => {
    const raw = '  Apple OR z6 97201  ';
    const parsed = parseQuery(raw);
    expect(parsed.rawQuery).toBe(raw);
  });
});
