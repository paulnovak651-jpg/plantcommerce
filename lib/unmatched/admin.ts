export const REVIEW_STATUSES = ['pending', 'resolved', 'ignored'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const RESOLVED_TYPES = [
  'plant_entity',
  'cultivar',
  'named_material',
  'population',
] as const;
export type ResolvedType = (typeof RESOLVED_TYPES)[number];

const REVIEW_STATUS_SET = new Set<string>(REVIEW_STATUSES);
const RESOLVED_TYPE_SET = new Set<string>(RESOLVED_TYPES);

export function parseReviewStatus(value: string | null): ReviewStatus | null {
  if (!value) return null;
  return REVIEW_STATUS_SET.has(value) ? (value as ReviewStatus) : null;
}

export function parseResolvedType(value: string | null): ResolvedType | null {
  if (!value) return null;
  return RESOLVED_TYPE_SET.has(value) ? (value as ResolvedType) : null;
}

export function parseListStatus(
  value: string | null
): ReviewStatus | 'all' {
  if (!value || value === 'all') return 'all';
  const parsed = parseReviewStatus(value);
  return parsed ?? 'all';
}

export function parseLimit(
  value: string | null,
  fallback = 100,
  min = 1,
  max = 500
): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeReviewerNotes(
  value: unknown,
  maxLen = 2000
): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}
