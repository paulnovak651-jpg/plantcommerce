import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ cultivar?: string }>;
}

export default async function NewListingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cultivar = sp.cultivar?.trim();
  redirect(
    cultivar
      ? `/marketplace/submit?cultivar=${encodeURIComponent(cultivar)}`
      : '/marketplace/submit'
  );
}
