import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{
    q?: string;
    zone?: string;
    category?: string;
    inStock?: string;
  }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  if (sp.q?.trim()) {
    params.set('q', sp.q.trim());
  }

  if (sp.category?.trim()) {
    params.set('category', sp.category.trim());
  }

  const parsedZone = Number(sp.zone);
  if (Number.isFinite(parsedZone) && parsedZone >= 1 && parsedZone <= 13) {
    params.set('zoneMin', String(parsedZone));
    params.set('zoneMax', String(parsedZone));
  }

  if (sp.inStock === 'true') {
    params.set('available', 'true');
  }

  const target = params.toString() ? `/?${params.toString()}` : '/';
  redirect(target);
}
