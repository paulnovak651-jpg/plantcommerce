import { filterBrowsePlants, type BrowsePlant } from '@/lib/queries/browse';

function makePlant(overrides: Partial<BrowsePlant> = {}): BrowsePlant {
  return {
    id: 'p1',
    slug: 'test-plant',
    canonical_name: 'Test Plant',
    botanical_name: null,
    display_category: null,
    nursery_count: 0,
    cultivar_count: 0,
    zone_min: null,
    zone_max: null,
    chill_hours_min: null,
    chill_hours_max: null,
    years_to_bearing_min: null,
    years_to_bearing_max: null,
    mature_height_min_ft: null,
    mature_height_max_ft: null,
    mature_spread_min_ft: null,
    mature_spread_max_ft: null,
    soil_ph_min: null,
    soil_ph_max: null,
    sun_requirement: null,
    growth_rate: null,
    genus_slug: null,
    genus_name: null,
    lowest_price_cents: null,
    best_nursery_name: null,
    has_growing_profile: false,
    ...overrides,
  };
}

describe('filterBrowsePlants', () => {
  it('returns all plants when no filters set', () => {
    const plants = [makePlant({ id: 'a' }), makePlant({ id: 'b' })];
    const result = filterBrowsePlants(plants, {});
    expect(result.total).toBe(2);
  });

  it('filters by keyword (q)', () => {
    const plants = [
      makePlant({ id: 'a', canonical_name: 'Jefferson Hazelnut' }),
      makePlant({ id: 'b', canonical_name: 'York Chestnut' }),
    ];
    const result = filterBrowsePlants(plants, { q: 'hazel' });
    expect(result.total).toBe(1);
    expect(result.plants[0].id).toBe('a');
  });

  it('filters by category', () => {
    const plants = [
      makePlant({ id: 'a', display_category: 'Nut Trees' }),
      makePlant({ id: 'b', display_category: 'Berries' }),
    ];
    const result = filterBrowsePlants(plants, { categories: ['Nut Trees'] });
    expect(result.total).toBe(1);
  });

  it('filters by zone range', () => {
    const plants = [
      makePlant({ id: 'a', zone_min: 3, zone_max: 7 }),
      makePlant({ id: 'b', zone_min: 8, zone_max: 10 }),
    ];
    const result = filterBrowsePlants(plants, { zoneMin: 4, zoneMax: 6 });
    expect(result.total).toBe(1);
    expect(result.plants[0].id).toBe('a');
  });

  it('filters by availability', () => {
    const plants = [
      makePlant({ id: 'a', nursery_count: 3 }),
      makePlant({ id: 'b', nursery_count: 0 }),
    ];
    const result = filterBrowsePlants(plants, { availableOnly: true });
    expect(result.total).toBe(1);
    expect(result.plants[0].id).toBe('a');
  });

  it('filters by chill hours range', () => {
    const plants = [
      makePlant({ id: 'a', chill_hours_min: 400, chill_hours_max: 800 }),
      makePlant({ id: 'b', chill_hours_min: 100, chill_hours_max: 300 }),
    ];
    const result = filterBrowsePlants(plants, { chillHoursMin: 500 });
    expect(result.total).toBe(1);
    expect(result.plants[0].id).toBe('a');
  });

  it('filters by bearing age', () => {
    const plants = [
      makePlant({ id: 'a', years_to_bearing_min: 2, years_to_bearing_max: 4 }),
      makePlant({ id: 'b', years_to_bearing_min: 6, years_to_bearing_max: 10 }),
    ];
    const result = filterBrowsePlants(plants, { bearingAgeMax: 5 });
    expect(result.total).toBe(1);
    expect(result.plants[0].id).toBe('a');
  });

  it('filters by height range', () => {
    const plants = [
      makePlant({ id: 'a', mature_height_min_ft: 10, mature_height_max_ft: 20 }),
      makePlant({ id: 'b', mature_height_min_ft: 30, mature_height_max_ft: 50 }),
    ];
    const result = filterBrowsePlants(plants, { heightMax: 25 });
    expect(result.total).toBe(1);
    expect(result.plants[0].id).toBe('a');
  });

  it('paginates correctly', () => {
    const plants = Array.from({ length: 50 }, (_, i) =>
      makePlant({ id: `p${i}`, canonical_name: `Plant ${String(i).padStart(2, '0')}` })
    );
    const page1 = filterBrowsePlants(plants, { page: 1, perPage: 10 });
    expect(page1.plants.length).toBe(10);
    expect(page1.total).toBe(50);

    const page2 = filterBrowsePlants(plants, { page: 2, perPage: 10 });
    expect(page2.plants.length).toBe(10);
    expect(page2.plants[0].id).not.toBe(page1.plants[0].id);
  });

  it('sorts by name descending', () => {
    const plants = [
      makePlant({ id: 'a', canonical_name: 'Apple' }),
      makePlant({ id: 'b', canonical_name: 'Banana' }),
    ];
    const result = filterBrowsePlants(plants, { sort: 'name-desc' });
    expect(result.plants[0].canonical_name).toBe('Banana');
  });

  it('sorts by availability', () => {
    const plants = [
      makePlant({ id: 'a', canonical_name: 'Apple', nursery_count: 1 }),
      makePlant({ id: 'b', canonical_name: 'Banana', nursery_count: 5 }),
    ];
    const result = filterBrowsePlants(plants, { sort: 'available' });
    expect(result.plants[0].id).toBe('b');
  });

  it('includes new BrowsePlant fields in output', () => {
    const plants = [
      makePlant({
        id: 'a',
        lowest_price_cents: 1800,
        best_nursery_name: 'Test Nursery',
        has_growing_profile: true,
      }),
    ];
    const result = filterBrowsePlants(plants, {});
    expect(result.plants[0].lowest_price_cents).toBe(1800);
    expect(result.plants[0].best_nursery_name).toBe('Test Nursery');
    expect(result.plants[0].has_growing_profile).toBe(true);
  });
});
