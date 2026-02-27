import { Text } from '@/components/ui/Text';
import type { CommunityListing } from '@/lib/types';

function daysAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function formatPrice(priceCents: number | null): string {
  if (priceCents === null) return 'Trade / Contact';
  if (priceCents === 0) return 'Free';
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function ListingCard({ listing }: { listing: CommunityListing }) {
  const isWts = listing.listing_type === 'wts';
  const displayName =
    listing.cultivars?.canonical_name ?? listing.raw_cultivar_text;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isWts
                ? 'bg-accent-light text-status-active'
                : 'bg-accent-subtle text-accent'
            }`}
          >
            {isWts ? 'WTS' : 'WTB'}
          </span>
          <Text variant="body" className="font-medium">
            {displayName}
          </Text>
        </div>
        <Text variant="sm" color="tertiary" className="shrink-0">
          {daysAgo(listing.created_at)}
        </Text>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {listing.material_type && listing.material_type !== 'unknown' && (
          <Text variant="caption" color="secondary">
            {listing.material_type.replace(/_/g, ' ')}
          </Text>
        )}
        {listing.quantity && (
          <Text variant="caption" color="secondary">
            Qty: {listing.quantity}
          </Text>
        )}
        <Text variant="caption" color="secondary">
          {formatPrice(listing.price_cents)}
        </Text>
        <Text variant="caption" color="secondary">
          {listing.location_state}
        </Text>
      </div>

      {listing.notes && (
        <Text variant="caption" color="tertiary" className="mt-1.5 line-clamp-2">
          {listing.notes}
        </Text>
      )}
    </div>
  );
}
