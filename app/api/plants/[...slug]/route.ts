import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies } from '@/lib/queries/plants';
import {
  getCultivarBySpeciesAndSlug,
  getOffersForCultivar,
  getAliasesForCultivar,
  getLegalIdentifiers,
} from '@/lib/queries/cultivars';
import { apiSuccess, apiNotFound, apiError } from '@/lib/api-helpers';
import { buildPaginationLinks, parsePagination } from '@/lib/pagination';
import { withRateLimit } from '@/lib/api-rate-limit';

type SparseFields = string[] | null;

function parseSparseFields(raw: string | null): SparseFields {
  if (!raw) return null;
  const fields = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return fields.length > 0 ? fields : null;
}

function selectRootFields(fields: SparseFields, prefix: string): Set<string> | null {
  if (!fields) return null;
  const selected = new Set<string>();

  for (const token of fields) {
    if (token === '*' || token === prefix || token === `${prefix}.*`) {
      return null;
    }

    if (!token.includes('.')) {
      selected.add(token);
      continue;
    }

    if (token.startsWith(`${prefix}.`)) {
      const remainder = token.slice(prefix.length + 1);
      if (!remainder) continue;
      selected.add(remainder.split('.')[0] ?? remainder);
    }
  }

  return selected;
}

function selectNestedFields(fields: SparseFields, prefix: string): Set<string> | null {
  if (!fields) return null;
  const selected = new Set<string>();

  for (const token of fields) {
    if (token === '*' || token === prefix || token === `${prefix}.*`) {
      return null;
    }
    if (!token.startsWith(`${prefix}.`)) continue;

    const remainder = token.slice(prefix.length + 1);
    if (!remainder) continue;
    selected.add(remainder.split('.')[0] ?? remainder);
  }

  return selected;
}

function pickRecord(
  source: Record<string, unknown>,
  selected: Set<string> | null
): Record<string, unknown> {
  if (selected === null) return source;
  const output: Record<string, unknown> = {};
  for (const key of selected) {
    if (key in source) output[key] = source[key];
  }
  return output;
}

function shouldInclude(
  fieldsProvided: boolean,
  selected: Set<string> | null
): boolean {
  if (!fieldsProvided) return true;
  return selected === null || selected.size > 0;
}

function buildSpeciesPayload(
  species: Record<string, unknown>,
  cultivars: Array<Record<string, unknown>>,
  fields: SparseFields
): Record<string, unknown> {
  const fieldsProvided = fields !== null;
  const rootFields = selectRootFields(fields, 'data');
  const cultivarFields = selectNestedFields(fields, 'cultivars');

  const payload: Record<string, unknown> = { type: 'plant_entity' };
  if (shouldInclude(fieldsProvided, rootFields)) {
    payload.data = pickRecord(species, rootFields);
  }
  if (shouldInclude(fieldsProvided, cultivarFields)) {
    payload.cultivars = cultivars.map((cultivar) => pickRecord(cultivar, cultivarFields));
  }
  return payload;
}

function buildCultivarPayload(
  cultivar: Record<string, unknown>,
  offers: Array<Record<string, unknown>>,
  aliases: Array<Record<string, unknown>>,
  legalIdentifiers: Array<Record<string, unknown>>,
  fields: SparseFields
): Record<string, unknown> {
  const fieldsProvided = fields !== null;
  const rootFields = selectRootFields(fields, 'data');
  const offerFields = selectNestedFields(fields, 'offers');
  const aliasFields = selectNestedFields(fields, 'aliases');
  const legalFields = selectNestedFields(fields, 'legal_identifiers');

  const payload: Record<string, unknown> = { type: 'cultivar' };
  if (shouldInclude(fieldsProvided, rootFields)) {
    payload.data = pickRecord(cultivar, rootFields);
  }
  if (shouldInclude(fieldsProvided, offerFields)) {
    payload.offers = offers.map((offer) => pickRecord(offer, offerFields));
  }
  if (shouldInclude(fieldsProvided, aliasFields)) {
    payload.aliases = aliases.map((alias) => pickRecord(alias, aliasFields));
  }
  if (shouldInclude(fieldsProvided, legalFields)) {
    payload.legal_identifiers = legalIdentifiers.map((item) =>
      pickRecord(item, legalFields)
    );
  }
  return payload;
}

/**
 * JSON API for plants.
 *
 * GET /api/plants/corylus-avellana
 * GET /api/plants/corylus-avellana/jefferson
 */
export const GET = withRateLimit(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const pagination = parsePagination(request.nextUrl.searchParams);
  const fields = parseSparseFields(request.nextUrl.searchParams.get('fields'));

  if (slug.length === 1) {
    const speciesSlug = slug[0];
    const species = await getPlantEntityBySlug(supabase, speciesSlug);

    if (!species) return apiNotFound('Species');

    const cultivars = await getCultivarsForSpecies(supabase, species.id);
    const pagedCultivars = cultivars.slice(
      pagination.offset,
      pagination.offset + pagination.limit
    );
    const links = buildPaginationLinks(
      `/api/plants/${speciesSlug}`,
      request.nextUrl.searchParams,
      pagination,
      cultivars.length
    );
    links.web = `/plants/${speciesSlug}`;

    return apiSuccess(
      buildSpeciesPayload(
        species as unknown as Record<string, unknown>,
        pagedCultivars as unknown as Array<Record<string, unknown>>,
        fields
      ),
      { total: cultivars.length, ...pagination },
      links
    );
  }

  if (slug.length === 2) {
    const [speciesSlug, cultivarSlug] = slug;
    const cultivar = await getCultivarBySpeciesAndSlug(supabase, speciesSlug, cultivarSlug);
    if (!cultivar) return apiNotFound('Cultivar');

    const [offers, aliases, legal] = await Promise.all([
      getOffersForCultivar(supabase, cultivar.id),
      getAliasesForCultivar(supabase, cultivar.id),
      getLegalIdentifiers(supabase, cultivar.id),
    ]);
    const pagedOffers = offers.slice(
      pagination.offset,
      pagination.offset + pagination.limit
    );

    const links = buildPaginationLinks(
      `/api/plants/${speciesSlug}/${cultivarSlug}`,
      request.nextUrl.searchParams,
      pagination,
      offers.length
    );
    links.web = `/plants/${speciesSlug}/${cultivarSlug}`;
    links.species = `/api/plants/${speciesSlug}`;

    return apiSuccess(
      buildCultivarPayload(
        cultivar as unknown as Record<string, unknown>,
        pagedOffers as unknown as Array<Record<string, unknown>>,
        aliases as unknown as Array<Record<string, unknown>>,
        legal as unknown as Array<Record<string, unknown>>,
        fields
      ),
      { total: offers.length, ...pagination },
      links
    );
  }

  return apiError(
    'INVALID_PATH',
    'Expected /api/plants/{species} or /api/plants/{species}/{cultivar}',
    400
  );
}, { max: 60 });
