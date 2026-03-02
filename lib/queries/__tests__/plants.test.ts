import type { SupabaseClient } from '@supabase/supabase-js';
import { getHomepageCategories, getOfferStatsForSpecies } from '@/lib/queries/plants';

type Row = Record<string, unknown>;

interface MockTables {
  plant_entities?: Row[];
  cultivars?: Row[];
  inventory_offers?: Row[];
}

interface QueryChain extends PromiseLike<{ data: Row[]; error: null }> {
  select: (_columns: string) => QueryChain;
  eq: (column: string, value: unknown) => QueryChain;
  in: (column: string, values: unknown[]) => QueryChain;
  order: (_column: string) => QueryChain;
}

function createMockSupabase(tables: MockTables): SupabaseClient {
  return {
    from: (table: string) => {
      const sourceRows = (tables[table as keyof MockTables] ?? []).map((row) => ({ ...row }));
      let filteredRows = sourceRows;

      const chain = {
        select: (_columns: string) => chain,
        eq: (column: string, value: unknown) => {
          filteredRows = filteredRows.filter((row) => row[column] === value);
          return chain;
        },
        in: (column: string, values: unknown[]) => {
          filteredRows = filteredRows.filter((row) => values.includes(row[column]));
          return chain;
        },
        order: (_column: string) => chain,
        then: (
          onFulfilled?: ((value: { data: Row[]; error: null }) => unknown) | null,
          onRejected?: ((reason: unknown) => unknown) | null,
        ) => Promise.resolve({ data: filteredRows, error: null }).then(onFulfilled, onRejected),
      } satisfies QueryChain;

      return chain;
    },
  } as unknown as SupabaseClient;
}

describe('getOfferStatsForSpecies', () => {
  it('returns empty stats when cultivarIds is empty', async () => {
    const supabase = createMockSupabase({ inventory_offers: [] });
    const stats = await getOfferStatsForSpecies(supabase, []);
    expect(stats).toEqual({ nurseryCount: 0, perCultivar: {} });
  });

  it('counts unique nurseries for a single cultivar', async () => {
    const supabase = createMockSupabase({
      inventory_offers: [
        { cultivar_id: 'c1', nursery_id: 'n1', offer_status: 'active' },
        { cultivar_id: 'c1', nursery_id: 'n2', offer_status: 'active' },
        { cultivar_id: 'c1', nursery_id: 'n2', offer_status: 'active' },
      ],
    });

    const stats = await getOfferStatsForSpecies(supabase, ['c1']);
    expect(stats.nurseryCount).toBe(2);
    expect(stats.perCultivar).toEqual({ c1: 2 });
  });

  it('deduplicates species-level nurseries across cultivars', async () => {
    const supabase = createMockSupabase({
      inventory_offers: [
        { cultivar_id: 'c1', nursery_id: 'n1', offer_status: 'active' },
        { cultivar_id: 'c2', nursery_id: 'n1', offer_status: 'active' },
      ],
    });

    const stats = await getOfferStatsForSpecies(supabase, ['c1', 'c2']);
    expect(stats.nurseryCount).toBe(1);
    expect(stats.perCultivar).toEqual({ c1: 1, c2: 1 });
  });

  it('returns empty stats when Supabase has no offers', async () => {
    const supabase = createMockSupabase({ inventory_offers: [] });
    const stats = await getOfferStatsForSpecies(supabase, ['c1', 'c2']);
    expect(stats).toEqual({ nurseryCount: 0, perCultivar: {} });
  });
});

describe('getHomepageCategories', () => {
  it('builds category groups with counts, sorting, top species, and deduped nurseries', async () => {
    const supabase = createMockSupabase({
      plant_entities: [
        { id: 's1', slug: 'apple', canonical_name: 'Apple', display_category: 'Fruit', curation_status: 'published' },
        { id: 's2', slug: 'pear', canonical_name: 'Pear', display_category: 'Fruit', curation_status: 'published' },
        { id: 's3', slug: 'plum', canonical_name: 'Plum', display_category: 'Fruit', curation_status: 'published' },
        { id: 's4', slug: 'quince', canonical_name: 'Quince', display_category: 'Fruit', curation_status: 'published' },
        { id: 's5', slug: 'hazelnut', canonical_name: 'Hazelnut', display_category: 'Nut Trees', curation_status: 'published' },
        { id: 's6', slug: 'mystery', canonical_name: 'Mystery', display_category: null, curation_status: 'published' },
      ],
      cultivars: [
        { id: 'c1', plant_entity_id: 's1', curation_status: 'published' },
        { id: 'c2', plant_entity_id: 's1', curation_status: 'published' },
        { id: 'c3', plant_entity_id: 's2', curation_status: 'published' },
        { id: 'c4', plant_entity_id: 's3', curation_status: 'published' },
        { id: 'c5', plant_entity_id: 's3', curation_status: 'published' },
        { id: 'c6', plant_entity_id: 's4', curation_status: 'published' },
        { id: 'c7', plant_entity_id: 's5', curation_status: 'published' },
        { id: 'c8', plant_entity_id: 's6', curation_status: 'published' },
      ],
      inventory_offers: [
        { cultivar_id: 'c1', nursery_id: 'n1', offer_status: 'active' },
        { cultivar_id: 'c2', nursery_id: 'n2', offer_status: 'active' },
        { cultivar_id: 'c3', nursery_id: 'n1', offer_status: 'active' },
        { cultivar_id: 'c4', nursery_id: 'n3', offer_status: 'active' },
        { cultivar_id: 'c4', nursery_id: 'n4', offer_status: 'active' },
        { cultivar_id: 'c5', nursery_id: 'n3', offer_status: 'active' },
        { cultivar_id: 'c6', nursery_id: 'n4', offer_status: 'active' },
        { cultivar_id: 'c7', nursery_id: 'n5', offer_status: 'active' },
        { cultivar_id: 'c8', nursery_id: 'n6', offer_status: 'active' },
      ],
    });

    const categories = await getHomepageCategories(supabase);

    expect(categories.map((category) => category.category)).toEqual(['Fruit', 'Nut Trees', 'Other']);

    const fruit = categories[0];
    expect(fruit.species_count).toBe(4);
    expect(fruit.cultivar_count).toBe(6);
    expect(fruit.nursery_count).toBe(4);
    expect(fruit.top_species).toHaveLength(3);
    expect(fruit.top_species).toEqual([
      { slug: 'apple', canonical_name: 'Apple' },
      { slug: 'plum', canonical_name: 'Plum' },
      { slug: 'pear', canonical_name: 'Pear' },
    ]);

    const nutTrees = categories[1];
    expect(nutTrees.species_count).toBe(1);
    expect(nutTrees.cultivar_count).toBe(1);
    expect(nutTrees.nursery_count).toBe(1);
    expect(nutTrees.top_species).toEqual([{ slug: 'hazelnut', canonical_name: 'Hazelnut' }]);

    const other = categories[2];
    expect(other.species_count).toBe(1);
    expect(other.cultivar_count).toBe(1);
    expect(other.nursery_count).toBe(1);
    expect(other.top_species).toEqual([{ slug: 'mystery', canonical_name: 'Mystery' }]);
  });
});
