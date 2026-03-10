/** Format price from cents to display string like "$18.00" */
export function formatPrice(priceRaw: string | null, priceCents: number | null): string {
  if (priceRaw) return priceRaw;
  if (priceCents != null) return `$${(priceCents / 100).toFixed(2)}`;
  return 'Contact nursery';
}

/** Format a display token from snake_case to Title Case */
export function toDisplayToken(value: string | null | undefined): string | null {
  if (!value || value === 'unknown') return null;
  return value.replace(/_/g, ' ');
}

/** Relative time display like "3 days ago" */
export function daysAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
