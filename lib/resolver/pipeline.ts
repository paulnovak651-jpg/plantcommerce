// ============================================================================
// Pipeline: Full parse → resolve → output contract
// ============================================================================

import type { CanonicalData, AliasEntry, PipelineOutput, ResolutionStatus } from './types';
import { parseProductName } from './parser';
import { buildAliasIndex, resolveEntity } from './resolver';

/**
 * Process a raw product name through the full pipeline.
 * Returns the pipeline contract output shape.
 */
export function processProductName(
  rawProductName: string,
  aliasIndex: Map<string, AliasEntry>,
  canonical?: CanonicalData
): PipelineOutput {
  const parsed = parseProductName(rawProductName);
  const resolution = resolveEntity(parsed, aliasIndex, canonical);

  // Map entity type → resolution_status
  const statusMap: Record<string, ResolutionStatus> = {
    cultivar: 'resolved_cultivar',
    named_material: 'resolved_named_material',
    population: 'resolved_population',
    plant_entity: 'resolved_plant_entity',
    unresolved: 'unresolved',
  };

  return {
    rawProductName,
    parsedCoreName: parsed.coreName,
    parsedBotanical: parsed.botanicalExtracted,
    parsedPropagation: parsed.propagationMethod,
    parsedSaleForm: parsed.saleForm,
    parsedOrganic: parsed.organicStatus,
    parsedPatentInfo: parsed.patentInfo,
    strippedTokens: parsed.strippedTokens,
    resolutionStatus: statusMap[resolution.entityType] ?? 'unresolved',
    resolutionConfidence: resolution.confidence,
    resolvedEntityType: resolution.entityType,
    resolvedEntityId: resolution.entityId,
    resolvedCanonicalName: resolution.canonicalName,
    resolutionMethod: resolution.method,
    matchSource: resolution.matchSource,
  };
}

/**
 * Process a batch of raw product names.
 */
export function processBatch(
  rawNames: string[],
  aliasIndex: Map<string, AliasEntry>,
  canonical?: CanonicalData
): PipelineOutput[] {
  return rawNames.map((name) => processProductName(name, aliasIndex, canonical));
}

// Re-export everything for clean imports
export { parseProductName } from './parser';
export { normalize } from './parser';
export { buildAliasIndex, resolveEntity } from './resolver';
export type * from './types';
