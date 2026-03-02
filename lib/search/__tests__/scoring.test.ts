import type { SupabaseClient } from '@supabase/supabase-js';
import { scoreResults } from '@/lib/search/scoring';
import { haversine } from '@/lib/search/haversine';
import type { ParsedQuery } from '@/lib/search/parseQuery';
import type { SearchResult } from '@/lib/queries/search';

type MockRow = Record<string, unknown>;

function createMockSupabase(offers: MockRow[], nurseries: MockRow[]): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === 'inventory_offers') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          or: () => chain,
          in: () => chain,
          limit: () => ({ data: offers, error: null }),
        };
        return chain;
      }

      if (table === 'nurseries') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          or: () => chain,
          limit: () => ({ data: nurseries, error: null }),
          in: (_column: string, values: string[]) => ({
            data: nurseries.filter((nursery) => values.includes(String(nursery.id))),
            error: null,
          }),
        };
        return chain;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  } as unknown as SupabaseClient;
}

function makeParsed(overrides: Partial<ParsedQuery> = {}): ParsedQuery {
  return {
    rawQuery: '',
    plantTerms: [],
    edibleOnly: false,
    shippingOnly: false,
    localOnly: false,
    selfFertileOnly: false,
    useTagFilters: [],
    ...overrides,
  };
}

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    index_source: 'plant_entity',
    entity_id: 'entity-1',
    slug: 'entity-1',
    canonical_name: 'Apple',
    material_type: 'tree',
    botanical_name: null,
    species_common_name: null,
    species_slug: 'apple',
    genus: null,
    family: null,
    active_offer_count: 0,
    usda_zone_min: null,
    usda_zone_max: null,
    display_category: null,
    ...overrides,
  };
}

describe('empty input', () => {
  it('returns [] when results are empty', async () => {
    const supabase = createMockSupabase([], []);
    const scored = await scoreResults(supabase, makeParsed(), []);
    expect(scored).toEqual([]);
  });
});

describe('text match scoring', () => {
  it('scores full term match as 1.0', async () => {
    const supabase = createMockSupabase([], []);
    const parsed = makeParsed({ plantTerms: ['honeycrisp', 'apple'] });
    const [scored] = await scoreResults(supabase, parsed, [
      makeResult({ canonical_name: 'Honeycrisp Apple' }),
    ]);
    expect(scored.textMatchScore).toBe(1);
  });

  it('scores partial term match proportionally', async () => {
    const supabase = createMockSupabase([], []);
    const parsed = makeParsed({ plantTerms: ['honeycrisp', 'apple'] });
    const [scored] = await scoreResults(supabase, parsed, [
      makeResult({ canonical_name: 'Honeycrisp Pear' }),
    ]);
    expect(scored.textMatchScore).toBe(0.5);
  });

  it('defaults to 0.5 with no plant terms', async () => {
    const supabase = createMockSupabase([], []);
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()]);
    expect(scored.textMatchScore).toBe(0.5);
  });
});

describe('availability scoring', () => {
  it('scores 3+ active offers as 1.0', async () => {
    const supabase = createMockSupabase([], []);
    const [scored] = await scoreResults(supabase, makeParsed(), [
      makeResult({ active_offer_count: 3 }),
    ]);
    expect(scored.availabilityScore).toBe(1);
  });

  it('scores 1-2 active offers as 0.7', async () => {
    const supabase = createMockSupabase([], []);
    const [scoredOne] = await scoreResults(supabase, makeParsed(), [
      makeResult({ active_offer_count: 1 }),
    ]);
    const [scoredTwo] = await scoreResults(supabase, makeParsed(), [
      makeResult({ active_offer_count: 2 }),
    ]);
    expect(scoredOne.availabilityScore).toBe(0.7);
    expect(scoredTwo.availabilityScore).toBe(0.7);
  });

  it('scores zero active offers as 0.1', async () => {
    const supabase = createMockSupabase([], []);
    const [scored] = await scoreResults(supabase, makeParsed(), [
      makeResult({ active_offer_count: 0 }),
    ]);
    expect(scored.availabilityScore).toBe(0.1);
  });
});

describe('confidence scoring', () => {
  it('uses highest offer confidence and caps at 1.0', async () => {
    const supabase = createMockSupabase(
      [
        {
          plant_entity_id: 'entity-1',
          offer_status: 'active',
          resolution_confidence: 0.6,
          price_cents: 1000,
          nursery_id: 'nursery-1',
        },
        {
          plant_entity_id: 'entity-1',
          offer_status: 'active',
          resolution_confidence: 1.4,
          price_cents: 900,
          nursery_id: 'nursery-1',
        },
      ],
      [{ id: 'nursery-1', name: 'Nursery', location_state: 'OR', latitude: null, longitude: null, shipping_notes: null }],
    );

    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()]);
    expect(scored.confidenceScore).toBe(1);
  });

  it('scores confidence as 0 with no offers', async () => {
    const supabase = createMockSupabase([], []);
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()]);
    expect(scored.confidenceScore).toBe(0);
  });
});

describe('distance scoring', () => {
  it('scores as max(0, 1 - miles/500) with user location', async () => {
    const offers = [
      {
        plant_entity_id: 'entity-1',
        offer_status: 'active',
        resolution_confidence: 0.9,
        price_cents: 1000,
        nursery_id: 'nursery-1',
      },
    ];
    const nurseries = [
      {
        id: 'nursery-1',
        name: 'Nearby Nursery',
        location_state: 'OR',
        latitude: 1,
        longitude: 0,
        shipping_notes: null,
      },
    ];
    const supabase = createMockSupabase(offers, nurseries);
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()], 0, 0, 'OR');

    const miles = haversine(0, 0, 1, 0);
    const expected = Math.max(0, 1 - miles / 500);
    expect(scored.distanceScore).toBeCloseTo(expected, 6);
  });

  it('defaults distance score to 0.5 without user location', async () => {
    const supabase = createMockSupabase(
      [
        {
          plant_entity_id: 'entity-1',
          offer_status: 'active',
          resolution_confidence: 0.9,
          price_cents: 1000,
          nursery_id: 'nursery-1',
        },
      ],
      [{ id: 'nursery-1', name: 'Nursery', location_state: 'OR', latitude: 45, longitude: -122, shipping_notes: null }],
    );
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()]);
    expect(scored.distanceScore).toBe(0.5);
  });
});

describe('shipping scoring', () => {
  it('scores 1.0 for nationwide shipping notes', async () => {
    const supabase = createMockSupabase(
      [
        {
          plant_entity_id: 'entity-1',
          offer_status: 'active',
          resolution_confidence: 0.9,
          price_cents: 1000,
          nursery_id: 'nursery-1',
        },
      ],
      [
        {
          id: 'nursery-1',
          name: 'Nationwide Nursery',
          location_state: 'TX',
          latitude: null,
          longitude: null,
          shipping_notes: 'Ships nationwide',
        },
      ],
    );
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()], undefined, undefined, 'OR');
    expect(scored.shippingScore).toBe(1);
  });

  it('scores 0.7 for same-state nursery', async () => {
    const supabase = createMockSupabase(
      [
        {
          plant_entity_id: 'entity-1',
          offer_status: 'active',
          resolution_confidence: 0.9,
          price_cents: 1000,
          nursery_id: 'nursery-1',
        },
      ],
      [
        {
          id: 'nursery-1',
          name: 'Oregon Nursery',
          location_state: 'OR',
          latitude: null,
          longitude: null,
          shipping_notes: null,
        },
      ],
    );
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()], undefined, undefined, 'OR');
    expect(scored.shippingScore).toBe(0.7);
  });

  it('scores 0.3 when there is no shipping match', async () => {
    const supabase = createMockSupabase(
      [
        {
          plant_entity_id: 'entity-1',
          offer_status: 'active',
          resolution_confidence: 0.9,
          price_cents: 1000,
          nursery_id: 'nursery-1',
        },
      ],
      [
        {
          id: 'nursery-1',
          name: 'Local Nursery',
          location_state: 'WA',
          latitude: null,
          longitude: null,
          shipping_notes: null,
        },
      ],
    );
    const [scored] = await scoreResults(supabase, makeParsed(), [makeResult()], undefined, undefined, 'OR');
    expect(scored.shippingScore).toBe(0.3);
  });
});

describe('composite score', () => {
  it('computes weighted composite and sorts descending', async () => {
    const results = [
      makeResult({
        entity_id: 'entity-1',
        canonical_name: 'Apple',
        active_offer_count: 3,
      }),
      makeResult({
        entity_id: 'entity-2',
        canonical_name: 'Pear',
        active_offer_count: 0,
      }),
    ];

    const offers = [
      {
        plant_entity_id: 'entity-1',
        offer_status: 'active',
        resolution_confidence: 1,
        price_cents: 500,
        nursery_id: 'nursery-1',
      },
      {
        plant_entity_id: 'entity-2',
        offer_status: 'active',
        resolution_confidence: 0.2,
        price_cents: 800,
        nursery_id: 'nursery-2',
      },
    ];

    const nurseries = [
      {
        id: 'nursery-1',
        name: 'Nationwide Nursery',
        location_state: 'CA',
        latitude: null,
        longitude: null,
        shipping_notes: 'all states',
      },
      {
        id: 'nursery-2',
        name: 'Local Nursery',
        location_state: 'TX',
        latitude: null,
        longitude: null,
        shipping_notes: null,
      },
    ];

    const parsed = makeParsed({ plantTerms: ['apple'] });
    const scored = await scoreResults(createMockSupabase(offers, nurseries), parsed, results);

    const first = scored[0];
    const expectedFirst =
      first.textMatchScore * 0.35 +
      first.availabilityScore * 0.25 +
      first.confidenceScore * 0.20 +
      first.distanceScore * 0.10 +
      first.shippingScore * 0.10;

    expect(first.compositeScore).toBeCloseTo(expectedFirst, 3);
    expect(scored[0].entity_id).toBe('entity-1');
    expect(scored[1].entity_id).toBe('entity-2');
    expect(scored[0].compositeScore).toBeGreaterThan(scored[1].compositeScore);
  });
});

describe('best price', () => {
  it('picks lowest positive price and ignores null/zero', async () => {
    const offers = [
      {
        plant_entity_id: 'entity-1',
        offer_status: 'active',
        resolution_confidence: 0.5,
        price_cents: null,
        nursery_id: 'nursery-1',
      },
      {
        plant_entity_id: 'entity-1',
        offer_status: 'active',
        resolution_confidence: 0.6,
        price_cents: 0,
        nursery_id: 'nursery-1',
      },
      {
        plant_entity_id: 'entity-1',
        offer_status: 'active',
        resolution_confidence: 0.7,
        price_cents: 1500,
        nursery_id: 'nursery-1',
      },
      {
        plant_entity_id: 'entity-1',
        offer_status: 'active',
        resolution_confidence: 0.8,
        price_cents: 1200,
        nursery_id: 'nursery-1',
      },
    ];
    const nurseries = [
      {
        id: 'nursery-1',
        name: 'Test Nursery',
        location_state: 'OR',
        latitude: null,
        longitude: null,
        shipping_notes: null,
      },
    ];

    const [scored] = await scoreResults(createMockSupabase(offers, nurseries), makeParsed(), [
      makeResult(),
    ]);

    expect(scored.bestPriceCents).toBe(1200);
  });
});
