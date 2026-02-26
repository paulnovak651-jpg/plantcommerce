import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Text } from '@/components/ui/Text';
import { ListingForm } from '@/components/ListingForm';

export const metadata: Metadata = {
  title: 'List a Plant',
  description:
    'Share a plant you have available or post a wanted listing. Free, no account required.',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ cultivar?: string }>;
}

export default async function NewListingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefillCultivar = sp.cultivar?.trim() ?? undefined;

  return (
    <div className="space-y-[var(--spacing-zone)]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'List a Plant' }]} />

      <section>
        <Text variant="h1">List a Plant</Text>
        <Text variant="body" color="secondary" className="mt-1">
          Have a cultivar to offer or trade? Looking for something specific? Post it here
          — listings are reviewed and appear publicly once approved.
        </Text>
      </section>

      <section className="max-w-xl">
        <ListingForm prefillCultivar={prefillCultivar} />
      </section>
    </div>
  );
}
