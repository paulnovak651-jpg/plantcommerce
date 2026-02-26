import { describe, expect, it } from 'vitest';
import { generateSourceOfferKey } from '@/lib/pipeline/supabase-pipeline';

describe('generateSourceOfferKey', () => {
  it('uses URL + SKU + form size when available', () => {
    const key = generateSourceOfferKey(
      'nursery-1',
      'https://example.com/product/jefferson',
      'SKU-123',
      '1 gal',
      'Jefferson Hazelnut'
    );

    expect(key).toBe(
      'nursery-1|https://example.com/product/jefferson|SKU-123|1 gal'
    );
  });

  it('falls back to raw product name when all identifiers are empty', () => {
    const key = generateSourceOfferKey(
      'nursery-1',
      '',
      '',
      '',
      'Jefferson Hazelnut'
    );

    expect(key).toBe('nursery-1|Jefferson Hazelnut');
    expect(key).not.toBe('nursery-1|||');
  });

  it('produces different keys for different product names in degenerate case', () => {
    const keyA = generateSourceOfferKey(
      'nursery-1',
      '',
      '',
      '',
      'Jefferson Hazelnut'
    );
    const keyB = generateSourceOfferKey(
      'nursery-1',
      '',
      '',
      '',
      'Yamhill Hazelnut'
    );

    expect(keyA).not.toBe(keyB);
  });
});
