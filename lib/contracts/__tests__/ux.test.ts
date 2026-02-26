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
      materialType: 'cultivar',
      availability: 'in_stock',
      sort: 'name_asc',
    });

    expect(parsed).toEqual({
      q: 'hazelnut',
      page: 1,
      limit: 100,
      materialType: 'cultivar',
      availability: 'in_stock',
      sort: 'name_asc',
    });
  });

  it('falls back for unknown enum values', () => {
    const parsed = parseSearchUrlStateFromRecord({
      availability: 'broken-value',
      sort: 'bad-sort',
    });

    expect(parsed.availability).toBe('any');
    expect(parsed.sort).toBe('relevance');
  });
});

describe('parseSearchApiParams', () => {
  it('reads and trims query values', () => {
    const params = new URLSearchParams({ q: '  filbert  ', limit: '7' });
    expect(parseSearchApiParams(params)).toEqual({ query: 'filbert', limit: 7 });
  });

  it('uses safe limit bounds', () => {
    const low = new URLSearchParams({ limit: '-10' });
    const high = new URLSearchParams({ limit: '9000' });
    expect(parseSearchApiParams(low).limit).toBe(20);
    expect(parseSearchApiParams(high).limit).toBe(100);
  });
});

describe('toSearchQueryString', () => {
  it('omits defaults and serializes non-default values', () => {
    const query = toSearchQueryString({
      q: 'hazelnut',
      page: 2,
      sort: 'offers_desc',
      availability: 'in_stock',
    });

    const params = new URLSearchParams(query);
    expect(params.get('q')).toBe('hazelnut');
    expect(params.get('page')).toBe('2');
    expect(params.get('sort')).toBe('offers_desc');
    expect(params.get('availability')).toBe('in_stock');
    expect(params.get('limit')).toBeNull();
  });
});
