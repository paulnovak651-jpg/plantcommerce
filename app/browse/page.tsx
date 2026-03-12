import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The /browse page now redirects to the homepage browse funnel.
 * Query params are preserved so old bookmarks still work.
 */
export default async function BrowsePage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  redirect(qs ? `/?${qs}` : '/');
}
