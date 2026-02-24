// ============================================================================
// Plant Commerce Platform — Core Types
// Mirrors the Postgres enums and pipeline contract
// ============================================================================

export type EntityType = 'cultivar' | 'named_material' | 'population' | 'plant_entity' | 'unresolved';

export type ResolutionStatus =
  | 'resolved_cultivar'
  | 'resolved_plant_entity'
  | 'resolved_named_material'
  | 'resolved_population'
  | 'unresolved'
  | 'review_needed';

export type MaterialType =
  | 'cultivar_clone'
  | 'named_seed_strain'
  | 'breeding_population'
  | 'geographic_population'
  | 'species_seedling'
  | 'unknown_named_line';

export type PropagationMethod =
  | 'grafted'
  | 'layered_clone'
  | 'tissue_cultured'
  | 'seedling'
  | 'seed'
  | 'cutting'
  | 'unknown';

export type SaleForm =
  | 'bare_root'
  | 'potted'
  | 'plug'
  | 'tubeling'
  | 'container'
  | 'field_dug'
  | 'unknown';

export type GeneticSpecificity =
  | 'cultivar_clone'
  | 'cultivar_derived_seed'
  | 'species_seedling'
  | 'mixed_population'
  | 'unknown';

export type ResolutionMethod =
  | 'direct'
  | 'strip_the'
  | 'add_the'
  | 'botanical_fallback'
  | 'botanical_match'
  | 'raw_match'
  | 'species_keyword'
  | 'generic_default'
  | 'word_match'
  | 'bigram_match'
  | 'trigram_match'
  | 'none';

// ── Parsed output from name decomposition ──

export interface ParsedProductName {
  raw: string;
  coreName: string;
  botanicalExtracted: string | null;
  propagationMethod: PropagationMethod | null;
  saleForm: SaleForm | null;
  organicStatus: 'organic' | 'conventional' | null;
  ageSize: string | null;
  patentInfo: string | null;
  trademarkFound: boolean;
  marketingText: string | null;
  strippedTokens: string[];
}

// ── Alias index entry ──

export interface AliasEntry {
  entityType: EntityType;
  entityId: string;
  canonicalName: string;
  matchSource: string;
}

// ── Resolution result ──

export interface ResolutionResult {
  resolved: boolean;
  method: ResolutionMethod;
  confidence: number;
  entityType: EntityType;
  entityId: string | null;
  canonicalName: string | null;
  matchSource: string | null;
}

// ── Full pipeline output (the contract) ──

export interface PipelineOutput {
  rawProductName: string;
  parsedCoreName: string;
  parsedBotanical: string | null;
  parsedPropagation: PropagationMethod | null;
  parsedSaleForm: SaleForm | null;
  parsedOrganic: 'organic' | 'conventional' | null;
  parsedPatentInfo: string | null;
  strippedTokens: string[];
  resolutionStatus: ResolutionStatus;
  resolutionConfidence: number;
  resolvedEntityType: EntityType;
  resolvedEntityId: string | null;
  resolvedCanonicalName: string | null;
  resolutionMethod: ResolutionMethod;
  matchSource: string | null;
}

// ── Canonical data shapes (for JSON test data) ──

export interface CanonicalPlantEntity {
  id: string;
  canonical_name: string;
  botanical_name: string;
  family: string;
  genus: string;
  species: string | null;
  entity_type: string;
  common_aliases?: string[];
}

export interface CanonicalCultivar {
  id: string;
  canonical_name: string;
  plant_entity_id: string;
  material_type: string;
  aliases?: string[];
}

export interface CanonicalNamedMaterial {
  id: string;
  canonical_name: string;
  plant_entity_id: string;
  material_type: string;
  aliases?: string[];
}

export interface CanonicalPopulation {
  id: string;
  canonical_name: string;
  plant_entity_id: string | null;
  material_type: string;
  aliases?: string[];
}

export interface CanonicalData {
  plant_entities: CanonicalPlantEntity[];
  cultivars: CanonicalCultivar[];
  named_materials: CanonicalNamedMaterial[];
  populations: CanonicalPopulation[];
}

export interface TestCase {
  nursery: string;
  raw_product_name: string;
  expected_entity_type: EntityType;
  expected_entity_id: string;
}
