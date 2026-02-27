import Link from 'next/link';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';

interface PriceComparisonTableProps {
  offers: Array<{
    nurseryName: string;
    nurserySlug: string;
    price: string | null;
    priceCents: number | null;
    availability: string | null;
    propagationMethod: string | null;
    saleForm: string | null;
    productUrl: string | null;
    location: string;
  }>;
}

function formatPrice(price: string | null, priceCents: number | null): string {
  if (price) return price;
  if (priceCents != null) return `$${(priceCents / 100).toFixed(2)}`;
  return 'Contact nursery';
}

function toDisplayToken(value: string | null): string | null {
  if (!value || value === 'unknown') return null;
  return value.replace(/_/g, ' ');
}

export function PriceComparisonTable({ offers }: PriceComparisonTableProps) {
  const sortedOffers = [...offers].sort((a, b) => {
    if (a.priceCents == null && b.priceCents == null) {
      return a.nurseryName.localeCompare(b.nurseryName);
    }
    if (a.priceCents == null) return 1;
    if (b.priceCents == null) return -1;
    return a.priceCents - b.priceCents;
  });

  const lowestPriced = sortedOffers.find((offer) => offer.priceCents != null) ?? null;

  return (
    <Surface elevation="raised" padding="default">
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
              const isLowest =
                lowestPriced != null &&
                offer.priceCents != null &&
                offer.priceCents === lowestPriced.priceCents &&
                offer.nurserySlug === lowestPriced.nurserySlug;
              const formParts = [
                toDisplayToken(offer.propagationMethod),
                toDisplayToken(offer.saleForm),
              ].filter((part): part is string => Boolean(part));

              return (
                <tr
                  key={`${offer.nurserySlug}-${offer.productUrl ?? offer.nurseryName}`}
                  className={`border-b border-border-subtle ${
                    isLowest ? 'bg-accent-subtle' : ''
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
                      {offer.location && (
                        <span className="text-xs text-text-tertiary">{offer.location}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-text-primary">
                    {formatPrice(offer.price, offer.priceCents)}
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {offer.availability ?? 'Unknown'}
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

      {lowestPriced && (
        <Text variant="sm" color="secondary" className="mt-3">
          Lowest price: {formatPrice(lowestPriced.price, lowestPriced.priceCents)} at{' '}
          {lowestPriced.nurseryName}
        </Text>
      )}
    </Surface>
  );
}
