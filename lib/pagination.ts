export interface PaginationParams {
  limit: number;
  offset: number;
}

interface ParsePaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

function parseNonNegativeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: ParsePaginationOptions = {}
): PaginationParams {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;

  const limit = clamp(
    parsePositiveInt(searchParams.get('limit'), defaultLimit),
    1,
    maxLimit
  );
  const offset = parseNonNegativeInt(searchParams.get('offset'), 0);

  return { limit, offset };
}

function toPathWithQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}

export function buildPaginationLinks(
  path: string,
  sourceParams: URLSearchParams,
  pagination: PaginationParams,
  total: number
): Record<string, string> {
  const base = new URLSearchParams(sourceParams.toString());
  base.delete('limit');
  base.delete('offset');

  const makeLink = (offset: number) => {
    const params = new URLSearchParams(base.toString());
    params.set('limit', String(pagination.limit));
    params.set('offset', String(offset));
    return toPathWithQuery(path, params);
  };

  const links: Record<string, string> = {
    self: makeLink(pagination.offset),
  };

  if (pagination.offset > 0) {
    links.prev = makeLink(Math.max(0, pagination.offset - pagination.limit));
  }

  if (pagination.offset + pagination.limit < total) {
    links.next = makeLink(pagination.offset + pagination.limit);
  }

  return links;
}
