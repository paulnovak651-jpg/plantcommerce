import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { ListingForm } from '@/components/ListingForm';

export const metadata: Metadata = {
  title: 'Submit a Listing',
  description:
    'Submit a community marketplace listing for plants and plant material. Listings are reviewed before publishing.',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ cultivar?: string }>;
}

export default async function MarketplaceSubmitPage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefillCultivar = sp.cultivar?.trim() ?? undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Submit' },
        ]}
      />

      <section>
        <Text variant="h1">Submit a Listing</Text>
        <Text variant="body" color="secondary" className="mt-1">
          Offer plants to the community or post what you are looking for.
          Listings are reviewed before they appear publicly.
        </Text>
      </section>

      <section className="max-w-xl">
        <ListingForm prefillCultivar={prefillCultivar} />
      </section>
      </div>
    </div>
  );
}
