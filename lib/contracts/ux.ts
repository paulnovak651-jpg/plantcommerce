export type AvailabilityState =
  | 'in_stock'
  | 'partially_in_stock'
  | 'sold_out'
  | 'unknown';

export type SearchSort =
  | 'relevance'
  | 'offers_desc'
  | 'name_asc'
  | 'name_desc';

export interface SearchResultCardData {
  id: string;
  href: string;
  canonicalName: string;
  botanicalName: string | null;
  materialType: string;
  speciesCommonName: string | null;
  activeOfferCount: number;
}

export interface NurseryInventoryRowData {
  id: string;
  nurseryName: string;
  nurserySlug: string | null;
  canonicalName: string;
  rawProductName: string;
  priceText: string | null;
  availability: AvailabilityState;
  productUrl: string | null;
}

export interface ListingCardData {
  id: string;
  listingType: 'wts' | 'wtb';
  canonicalName: string | null;
  rawSpeciesText: string | null;
  rawCultivarText: string | null;
  materialType: string;
  quantity: number;
  priceCents: number | null;
  locationState: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  resolveConfidence: number | null;
  trustTier: 0 | 1 | 2 | 3;
}

export interface ModerationQueueRowData {
  id: string;
  submittedAt: string;
  userId: string;
  trustTier: 0 | 1 | 2 | 3;
  listingType: 'wts' | 'wtb';
  canonicalName: string | null;
  resolverStatus: 'resolved' | 'partial' | 'unresolved';
  resolveConfidence: number | null;
  reason: string | null;
}

export interface SearchUrlState {
  q: string;
  page: number;
  limit: number;
  materialType: string | null;
  availability: AvailabilityState | 'any';
  sort: SearchSort;
}

export const SEARCH_DEFAULTS: SearchUrlState = {
  q: '',
  page: 1,
  limit: 20,
  materialType: null,
  availability: 'any',
  sort: 'relevance',
};

const SEARCH_SORTS: ReadonlySet<SearchSort> = new Set([
  'relevance',
  'offers_desc',
  'name_asc',
  'name_desc',
]);

const AVAILABILITY_FILTERS: ReadonlySet<SearchUrlState['availability']> = new Set(
  ['any', 'in_stock', 'partially_in_stock', 'sold_out', 'unknown']
);

function toSingleValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseSearchUrlStateFromRecord(input: {
  q?: string | string[];
  page?: string | string[];
  limit?: string | string[];
  materialType?: string | string[];
  availability?: string | string[];
  sort?: string | string[];
}): SearchUrlState {
  const q = (toSingleValue(input.q) ?? '').trim();
  const page = toPositiveInt(toSingleValue(input.page), SEARCH_DEFAULTS.page);
  const limit = clamp(
    toPositiveInt(toSingleValue(input.limit), SEARCH_DEFAULTS.limit),
    1,
    100
  );
  const materialTypeRaw = (toSingleValue(input.materialType) ?? '').trim();
  const materialType = materialTypeRaw.length > 0 ? materialTypeRaw : null;

  const availabilityRaw = (toSingleValue(input.availability) ??
    SEARCH_DEFAULTS.availability) as SearchUrlState['availability'];
  const availability = AVAILABILITY_FILTERS.has(availabilityRaw)
    ? availabilityRaw
    : SEARCH_DEFAULTS.availability;

  const sortRaw = (toSingleValue(input.sort) ?? SEARCH_DEFAULTS.sort) as SearchSort;
  const sort = SEARCH_SORTS.has(sortRaw) ? sortRaw : SEARCH_DEFAULTS.sort;

  return {
    q,
    page,
    limit,
    materialType,
    availability,
    sort,
  };
}

export function parseSearchApiParams(searchParams: URLSearchParams): {
  query: string;
  limit: number;
} {
  const query = (searchParams.get('q') ?? '').trim();
  const limitRaw = searchParams.get('limit') ?? String(SEARCH_DEFAULTS.limit);
  const limit = clamp(toPositiveInt(limitRaw, SEARCH_DEFAULTS.limit), 1, 100);
  return { query, limit };
}

export function toSearchQueryString(state: Partial<SearchUrlState>): string {
  const merged: SearchUrlState = { ...SEARCH_DEFAULTS, ...state };
  const params = new URLSearchParams();

  if (merged.q.trim()) params.set('q', merged.q.trim());
  if (merged.page !== SEARCH_DEFAULTS.page) params.set('page', String(merged.page));
  if (merged.limit !== SEARCH_DEFAULTS.limit) params.set('limit', String(merged.limit));
  if (merged.materialType) params.set('materialType', merged.materialType);
  if (merged.availability !== SEARCH_DEFAULTS.availability) {
    params.set('availability', merged.availability);
  }
  if (merged.sort !== SEARCH_DEFAULTS.sort) params.set('sort', merged.sort);

  return params.toString();
}
