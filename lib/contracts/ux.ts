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
  zone?: number;
  category?: string;
  inStock?: boolean;
}

export const SEARCH_DEFAULTS: SearchUrlState = {
  q: '',
  page: 1,
  limit: 20,
};

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
  zone?: string | string[];
  category?: string | string[];
  inStock?: string | string[];
}): SearchUrlState {
  const q = (toSingleValue(input.q) ?? '').trim();
  const page = toPositiveInt(toSingleValue(input.page), SEARCH_DEFAULTS.page);
  const limit = clamp(
    toPositiveInt(toSingleValue(input.limit), SEARCH_DEFAULTS.limit),
    1,
    100
  );
  const zoneRaw = toSingleValue(input.zone);
  const zoneParsed = zoneRaw ? Number.parseInt(zoneRaw, 10) : undefined;
  const zone =
    zoneParsed != null &&
    Number.isFinite(zoneParsed) &&
    zoneParsed >= 1 &&
    zoneParsed <= 13
      ? zoneParsed
      : undefined;
  const categoryRaw = (toSingleValue(input.category) ?? '').trim();
  const category = categoryRaw.length > 0 ? categoryRaw : undefined;
  const inStockRaw = (toSingleValue(input.inStock) ?? '').trim().toLowerCase();
  const inStock = inStockRaw === 'true' ? true : undefined;

  return {
    q,
    page,
    limit,
    zone,
    category,
    inStock,
  };
}

export function parseSearchApiParams(searchParams: URLSearchParams): {
  query: string;
  limit: number;
  zone?: number;
  category?: string;
  inStock?: boolean;
} {
  const parsed = parseSearchUrlStateFromRecord({
    q: searchParams.get('q') ?? '',
    limit: searchParams.get('limit') ?? String(SEARCH_DEFAULTS.limit),
    zone: searchParams.get('zone') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    inStock: searchParams.get('inStock') ?? undefined,
  });

  return {
    query: parsed.q,
    limit: parsed.limit,
    zone: parsed.zone,
    category: parsed.category,
    inStock: parsed.inStock,
  };
}

export function toSearchQueryString(state: Partial<SearchUrlState>): string {
  const merged: SearchUrlState = { ...SEARCH_DEFAULTS, ...state };
  const params = new URLSearchParams();

  if (merged.q.trim()) params.set('q', merged.q.trim());
  if (merged.page !== SEARCH_DEFAULTS.page) params.set('page', String(merged.page));
  if (merged.limit !== SEARCH_DEFAULTS.limit) params.set('limit', String(merged.limit));
  if (merged.zone != null) params.set('zone', String(merged.zone));
  if (merged.category) params.set('category', merged.category);
  if (merged.inStock) params.set('inStock', 'true');

  return params.toString();
}
