import Link from 'next/link';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';

interface PriceChangeInfo {
  priceCentsOld: number;
  priceCentsNew: number;
}

interface OfferItem {
  nurseryName: string;
  nurserySlug: string;
  price: string | null;
  priceCents: number | null;
  availability: string | null;
  propagationMethod: string | null;
  saleForm: string | null;
  productUrl: string | null;
  location: string;
  offerStatus?: string;
  lastSeenAt?: string | null;
  priceChange?: PriceChangeInfo | null;
}

interface PriceComparisonTableProps {
  offers: OfferItem[];
}

function formatPrice(price: string | null, priceCents: number | null): string {
  if (price) return price;
  if (priceCents != null) return `$${(priceCents / 100).toFixed(2)}`;
  return 'Contact nursery';
}

function formatLastSeen(lastSeenAt: string | null | undefined): string | null {
  if (!lastSeenAt) return null;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Last seen today';
  if (days === 1) return 'Last seen 1 day ago';
  return `Last seen ${days} days ago`;
}

function PriceChangeIndicator({ change }: { change: PriceChangeInfo }) {
  const went = change.priceCentsNew < change.priceCentsOld ? 'down' : 'up';
  const oldPrice = `$${(change.priceCentsOld / 100).toFixed(2)}`;
  if (went === 'down') {
    return (
      <span className="flex items-center gap-0.5 text-xs text-green-600">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        was {oldPrice}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-red-500">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      was {oldPrice}
    </span>
  );
}

function toDisplayToken(value: string | null): string | null {
  if (!value || value === 'unknown') return null;
  return value.replace(/_/g, ' ');
}

export function PriceComparisonTable({ offers }: PriceComparisonTableProps) {
  const sortedOffers = [...offers].sort((a, b) => {
    // Stale offers sort to the bottom
    const aStale = a.offerStatus === 'stale' ? 1 : 0;
    const bStale = b.offerStatus === 'stale' ? 1 : 0;
    if (aStale !== bStale) return aStale - bStale;

    if (a.priceCents == null && b.priceCents == null) {
      return a.nurseryName.localeCompare(b.nurseryName);
    }
    if (a.priceCents == null) return 1;
    if (b.priceCents == null) return -1;
    return a.priceCents - b.priceCents;
  });

  const lowestPriced = sortedOffers.find(
    (offer) => offer.priceCents != null && offer.offerStatus !== 'stale'
  ) ?? null;

  return (
    <Surface elevation="raised" padding="default">
      <div className="space-y-3 sm:hidden">
        {sortedOffers.map((offer) => {
          const isStale = offer.offerStatus === 'stale';
          const isLowest =
            !isStale &&
            lowestPriced != null &&
            offer.priceCents != null &&
            offer.priceCents === lowestPriced.priceCents &&
            offer.nurserySlug === lowestPriced.nurserySlug;
          const formParts = [
            toDisplayToken(offer.propagationMethod),
            toDisplayToken(offer.saleForm),
          ].filter((part): part is string => Boolean(part));
          const lastSeenLabel = isStale ? formatLastSeen(offer.lastSeenAt) : null;

          return (
            <div
              key={`mobile-${offer.nurserySlug}-${offer.productUrl ?? offer.nurseryName}`}
              className={`rounded-[var(--radius-lg)] border p-4 ${
                isStale
                  ? 'border-border-subtle bg-surface-primary opacity-60'
                  : isLowest
                    ? 'border-accent bg-accent-subtle'
                    : 'border-border-subtle bg-surface-primary'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/nurseries/${offer.nurserySlug}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {offer.nurseryName}
                  </Link>
                  {offer.location && <p className="text-xs text-text-tertiary">{offer.location}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-serif text-lg font-semibold ${isStale ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                    {formatPrice(offer.price, offer.priceCents)}
                  </p>
                  {!isStale && offer.priceChange && (
                    <PriceChangeIndicator change={offer.priceChange} />
                  )}
                </div>
              </div>
              {isLowest && (
                <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Best Price
                </span>
              )}
              {isStale && lastSeenLabel && (
                <span className="mt-1 inline-block text-xs text-text-tertiary italic">
                  {lastSeenLabel}
                </span>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                {offer.availability && <span>{isStale ? 'Sold out / unavailable' : offer.availability}</span>}
                {formParts.length > 0 && <span>{formParts.join('  ')}</span>}
              </div>
              {offer.productUrl && (
                <a
                  href={offer.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 inline-flex w-full items-center justify-center rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors ${
                    isStale
                      ? 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  View at Nursery
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-text-tertiary">
              <th className="py-2 pr-4 font-medium">Nursery</th>
              <th className="py-2 pr-4 font-medium">Price</th>
              <th className="py-2 pr-4 font-medium">Availability</th>
              <th className="py-2 pr-4 font-medium">Form</th>
              <th className="py-2 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {sortedOffers.map((offer) => {
              const isStale = offer.offerStatus === 'stale';
              const isLowest =
                !isStale &&
                lowestPriced != null &&
                offer.priceCents != null &&
                offer.priceCents === lowestPriced.priceCents &&
                offer.nurserySlug === lowestPriced.nurserySlug;
              const formParts = [
                toDisplayToken(offer.propagationMethod),
                toDisplayToken(offer.saleForm),
              ].filter((part): part is string => Boolean(part));
              const lastSeenLabel = isStale ? formatLastSeen(offer.lastSeenAt) : null;

              return (
                <tr
                  key={`${offer.nurserySlug}-${offer.productUrl ?? offer.nurseryName}`}
                  className={`border-b border-border-subtle ${
                    isStale
                      ? 'opacity-60'
                      : isLowest
                        ? 'bg-accent-subtle'
                        : ''
                  }`}
                >
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <Link
                        href={`/nurseries/${offer.nurserySlug}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {offer.nurseryName}
                      </Link>
                      {isLowest && (
                        <span className="mt-0.5 inline-block w-fit rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Best Price
                        </span>
                      )}
                      {isStale && lastSeenLabel && (
                        <span className="mt-0.5 text-xs text-text-tertiary italic">
                          {lastSeenLabel}
                        </span>
                      )}
                      {offer.location && (
                        <span className="text-xs text-text-tertiary">{offer.location}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`font-semibold ${isStale ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                      {formatPrice(offer.price, offer.priceCents)}
                    </span>
                    {!isStale && offer.priceChange && (
                      <div className="mt-0.5">
                        <PriceChangeIndicator change={offer.priceChange} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {isStale ? 'Sold out / unavailable' : (offer.availability ?? 'Unknown')}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {formParts.length > 0 ? formParts.join(' · ') : 'N/A'}
                  </td>
                  <td className="py-3">
                    {offer.productUrl ? (
                      <a
                        href={offer.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        View →
                      </a>
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {lowestPriced && (
        <Text variant="sm" color="secondary" className="mt-3">
          Lowest price: {formatPrice(lowestPriced.price, lowestPriced.priceCents)} at{' '}
          {lowestPriced.nurseryName}
        </Text>
      )}
    </Surface>
  );
}
