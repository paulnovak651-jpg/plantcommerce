import { describe, expect, it } from 'vitest';
import {
  SEARCH_DEFAULTS,
  parseSearchApiParams,
  parseSearchUrlStateFromRecord,
  toSearchQueryString,
} from '@/lib/contracts/ux';

describe('parseSearchUrlStateFromRecord', () => {
  it('applies defaults when values are missing', () => {
    const parsed = parseSearchUrlStateFromRecord({});
    expect(parsed).toEqual(SEARCH_DEFAULTS);
  });

  it('normalizes and clamps provided values', () => {
    const parsed = parseSearchUrlStateFromRecord({
      q: '  hazelnut  ',
      page: '0',
      limit: '999',
      zone: '14',
      category: '  Nut Trees  ',
      inStock: 'true',
    });

    expect(parsed).toEqual({
      q: 'hazelnut',
      page: 1,
      limit: 100,
      zone: undefined,
      category: 'Nut Trees',
      inStock: true,
    });
  });

  it('falls back for invalid filter values', () => {
    const parsed = parseSearchUrlStateFromRecord({
      zone: 'abc',
      inStock: 'yes',
    });

    expect(parsed.zone).toBeUndefined();
    expect(parsed.inStock).toBeUndefined();
  });
});

describe('parseSearchApiParams', () => {
  it('reads and trims query values', () => {
    const params = new URLSearchParams({
      q: '  filbert  ',
      limit: '7',
      offset: '14',
      zone: '5',
      category: 'Nut Trees',
      inStock: 'true',
    });
    expect(parseSearchApiParams(params)).toEqual({
      query: 'filbert',
      limit: 7,
      offset: 14,
      zone: 5,
      category: 'Nut Trees',
      inStock: true,
    });
  });

  it('uses safe limit bounds', () => {
    const low = new URLSearchParams({ limit: '-10' });
    const high = new URLSearchParams({ limit: '9000' });
    expect(parseSearchApiParams(low).limit).toBe(20);
    expect(parseSearchApiParams(high).limit).toBe(100);
    expect(parseSearchApiParams(new URLSearchParams({ offset: '-2' })).offset).toBe(0);
  });
});

describe('toSearchQueryString', () => {
  it('omits defaults and serializes non-default values', () => {
    const query = toSearchQueryString({
      q: 'hazelnut',
      page: 2,
      zone: 5,
      category: 'Nut Trees',
      inStock: true,
    });

    const params = new URLSearchParams(query);
    expect(params.get('q')).toBe('hazelnut');
    expect(params.get('page')).toBe('2');
    expect(params.get('zone')).toBe('5');
    expect(params.get('category')).toBe('Nut Trees');
    expect(params.get('inStock')).toBe('true');
    expect(params.get('limit')).toBeNull();
  });
});
