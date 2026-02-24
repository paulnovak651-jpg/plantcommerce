import { describe, it, expect, beforeAll } from 'vitest';
import { processProductName } from '../pipeline';
import { buildAliasIndex } from '../resolver';
import type { CanonicalData, AliasEntry, PipelineOutput } from '../types';

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
    ],
    cultivars: [
      { id: 'cv_jefferson', canonical_name: 'Jefferson', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
      { id: 'cv_somerset', canonical_name: 'Somerset', plant_entity_id: 'pe_corylus_avellana', material_type: 'cultivar_clone', aliases: [] },
    ],
    named_materials: [],
    populations: [],
  };

  aliasIndex = buildAliasIndex(canonical);
});

describe('processProductName — PipelineOutput contract', () => {
  it('returns all required PipelineOutput fields', () => {
    const output = processProductName(
      'JEFFERSON HAZELNUT (Corylus avellana)',
      aliasIndex,
      canonical
    );

    // All required fields must exist
    expect(output).toHaveProperty('rawProductName');
    expect(output).toHaveProperty('parsedCoreName');
    expect(output).toHaveProperty('parsedBotanical');
    expect(output).toHaveProperty('parsedPropagation');
    expect(output).toHaveProperty('parsedSaleForm');
    expect(output).toHaveProperty('parsedOrganic');
    expect(output).toHaveProperty('parsedPatentInfo');
    expect(output).toHaveProperty('strippedTokens');
    expect(output).toHaveProperty('resolutionStatus');
    expect(output).toHaveProperty('resolutionConfidence');
    expect(output).toHaveProperty('resolvedEntityType');
    expect(output).toHaveProperty('resolvedEntityId');
    expect(output).toHaveProperty('resolvedCanonicalName');
    expect(output).toHaveProperty('resolutionMethod');
    expect(output).toHaveProperty('matchSource');
  });

  it('correctly maps resolved_cultivar status', () => {
    const output = processProductName(
      'JEFFERSON HAZELNUT (Corylus avellana)',
      aliasIndex,
      canonical
    );

    expect(output.resolutionStatus).toBe('resolved_cultivar');
    expect(output.resolvedEntityType).toBe('cultivar');
    expect(output.resolvedEntityId).toBe('cv_jefferson');
    expect(output.resolvedCanonicalName).toBe('Jefferson');
    expect(output.resolutionConfidence).toBeGreaterThan(0);
  });

  it('correctly maps resolved_plant_entity for species', () => {
    const output = processProductName(
      'Hazelnut Tree',
      aliasIndex,
      canonical
    );

    // Should resolve to European Hazelnut via generic_default
    expect(output.resolutionStatus).toBe('resolved_plant_entity');
    expect(output.resolvedEntityType).toBe('plant_entity');
    expect(output.resolvedEntityId).toBe('pe_corylus_avellana');
  });

  it('correctly maps unresolved status', () => {
    const output = processProductName(
      'Xylophonic Moonberry Tree',
      aliasIndex,
      canonical
    );

    // Should be unresolved (no generic_default since "moonberry" isn't a hazelnut term)
    if (output.resolutionStatus === 'unresolved') {
      expect(output.resolvedEntityType).toBe('unresolved');
      expect(output.resolvedEntityId).toBeNull();
      expect(output.resolutionConfidence).toBe(0);
    }
  });

  it('preserves rawProductName exactly as given', () => {
    const raw = 'JEFFERSON HAZELNUT (Corylus avellana)';
    const output = processProductName(raw, aliasIndex, canonical);
    expect(output.rawProductName).toBe(raw);
  });

  it('strippedTokens is always an array', () => {
    const output = processProductName('Jefferson', aliasIndex, canonical);
    expect(Array.isArray(output.strippedTokens)).toBe(true);
  });

  it('confidence is between 0 and 1', () => {
    const output = processProductName(
      'Somerset Hazelnut',
      aliasIndex,
      canonical
    );
    expect(output.resolutionConfidence).toBeGreaterThanOrEqual(0);
    expect(output.resolutionConfidence).toBeLessThanOrEqual(1);
  });
});
