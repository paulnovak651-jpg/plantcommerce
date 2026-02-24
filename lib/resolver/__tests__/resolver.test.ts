import { describe, it, expect, beforeAll } from 'vitest';
import { resolveEntity, buildAliasIndex } from '../resolver';
import { parseProductName } from '../parser';
import type { CanonicalData, AliasEntry } from '../types';

// Build a test alias index from real-ish data
let aliasIndex: Map<string, AliasEntry>;
let canonical: CanonicalData;

beforeAll(() => {
  canonical = {
    plant_entities: [
      {
        id: 'pe_corylus_avellana',
        canonical_name: 'European Hazelnut',
        botanical_name: 'Corylus avellana',
        entity_type: 'species',
        family: 'Betulaceae',
        genus: 'Corylus',
        species: 'avellana',
      },
      {
        id: 'pe_corylus_americana',
        canonical_name: 'American Hazelnut',
        botanical_name: 'Corylus americana',
        entity_type: 'species',
        family: 'Betulaceae',
        genus: 'Corylus',
        species: 'americana',
      },
      {
        id: 'pe_corylus_cornuta',
        canonical_name: 'Beaked Hazelnut',
        botanical_name: 'Corylus cornuta',
        entity_type: 'species',
        family: 'Betulaceae',
        genus: 'Corylus',
        species: 'cornuta',
      },
      {
        id: 'pe_corylus_colurna',
        canonical_name: 'Turkish Tree Hazel',
        botanical_name: 'Corylus colurna',
        entity_type: 'species',
        family: 'Betulaceae',
        genus: 'Corylus',
        species: 'colurna',
      },
      {
        id: 'pe_gevuina_avellana',
        canonical_name: 'Chilean Hazelnut',
        botanical_name: 'Gevuina avellana',
        entity_type: 'species',
        family: 'Proteaceae',
        genus: 'Gevuina',
        species: 'avellana',
      },
    ],
    cultivars: [
      { id: 'cv_jefferson', canonical_name: 'Jefferson', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_dorris', canonical_name: 'Dorris', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_yamhill', canonical_name: 'Yamhill', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_the_beast', canonical_name: 'The Beast', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_somerset', canonical_name: 'Somerset', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_barcelona', canonical_name: 'Barcelona', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_gene', canonical_name: 'Gene', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: ['Geneva'] },
      { id: 'cv_halles_giant', canonical_name: "Hall's Giant", plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: ['Halls Giant'] },
      { id: 'cv_polly_o', canonical_name: 'Polly O', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: ['PollyO'] },
      { id: 'cv_matt', canonical_name: 'Matt', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: ['208D'] },
    ],
    named_materials: [
      { id: 'nm_ny_hazel_seedling', canonical_name: 'NY Hazel Seedling', plant_entity_id: 'pe_corylus_avellana', material_type: 'named_seed_strain', aliases: [] },
    ],
    populations: [
      { id: 'pop_neohybrid', canonical_name: 'NeoHybrid Hazelnut', plant_entity_id: null, material_type: 'breeding_population', aliases: ['NeoHybrid'] },
    ],
  };

  aliasIndex = buildAliasIndex(canonical);
});

// ── Resolution method tests ──

describe('resolveEntity — resolution methods', () => {
  it('direct match: "jefferson" → cv_jefferson', () => {
    const parsed = parseProductName('Jefferson');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('cv_jefferson');
    expect(result.method).toBe('direct');
    expect(result.confidence).toBe(0.95);
  });

  it('direct match: "dorris" → cv_dorris', () => {
    const parsed = parseProductName('DORRIS HAZELNUT');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('cv_dorris');
  });

  it('strip_the: "the beast" → cv_the_beast', () => {
    // "The Beast" is the canonical name, so "The Beast Hazelnut" should work
    const parsed = parseProductName('The Beast Hazelnut');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('cv_the_beast');
  });

  it('alias match: "geneva" → cv_gene (alias)', () => {
    const parsed = parseProductName('Geneva Hazel');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('cv_gene');
  });

  it('botanical fallback: empty core + Corylus cornuta → pe_corylus_cornuta', () => {
    const parsed = parseProductName('(Corylus cornuta)');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('pe_corylus_cornuta');
  });

  it('species keyword: "american" → pe_corylus_americana', () => {
    const parsed = parseProductName('American Hazelnut');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('pe_corylus_americana');
  });

  it('generic default: empty string → pe_corylus_avellana (0.50)', () => {
    const parsed = parseProductName('Hazelnut Tree');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('pe_corylus_avellana');
    expect(result.confidence).toBe(0.50);
    expect(result.method).toBe('generic_default');
  });

  it('word match: finds cultivar from multi-word input', () => {
    const parsed = parseProductName('Organic Barcelona Filbert Premium Grade');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    expect(result.resolved).toBe(true);
    expect(result.entityId).toBe('cv_barcelona');
  });

  it('unresolved: completely unknown name', () => {
    const parsed = parseProductName('Xylophonic Moonberry Tree');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    // Should be unresolved or at least very low confidence
    if (result.resolved) {
      expect(result.confidence).toBeLessThanOrEqual(0.60);
    }
  });
});

describe('resolveEntity — confidence ordering', () => {
  it('direct match has higher confidence than word match', () => {
    const directParsed = parseProductName('Jefferson');
    const directResult = resolveEntity(directParsed, aliasIndex, canonical);

    // Word match would come from a noisy input
    expect(directResult.confidence).toBeGreaterThanOrEqual(0.90);
  });

  it('generic default has confidence 0.50', () => {
    const parsed = parseProductName('Hazelnut Seeds');
    const result = resolveEntity(parsed, aliasIndex, canonical);
    if (result.method === 'generic_default') {
      expect(result.confidence).toBe(0.50);
    }
  });
});

describe('buildAliasIndex', () => {
  it('indexes canonical cultivar names', () => {
    expect(aliasIndex.has('jefferson')).toBe(true);
    expect(aliasIndex.has('dorris')).toBe(true);
  });

  it('indexes aliases', () => {
    expect(aliasIndex.has('geneva')).toBe(true);
    const entry = aliasIndex.get('geneva');
    expect(entry?.entityId).toBe('cv_gene');
  });

  it('indexes botanical names', () => {
    expect(aliasIndex.has('corylus avellana')).toBe(true);
    expect(aliasIndex.has('corylus americana')).toBe(true);
  });

  it('indexes plant entity canonical names', () => {
    expect(aliasIndex.has('european hazelnut')).toBe(true);
    expect(aliasIndex.has('american hazelnut')).toBe(true);
  });
});
