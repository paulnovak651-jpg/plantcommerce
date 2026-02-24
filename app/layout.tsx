import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import { SkipNav } from '@/components/SkipNav';
import { createAnonClient } from '@/lib/supabase/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://plantcommerce.app'),
  title: {
    default: 'Plant Commerce — Find Plants, Compare Nurseries',
    template: '%s | Plant Commerce',
  },
  description:
    'Comprehensive plant database and nursery inventory aggregator for the permaculture community. Search cultivars, compare availability, find what you need.',
  openGraph: {
    siteName: 'Plant Commerce',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
  },
};

/**
 * Cache the species list so the layout nav doesn't make the entire app dynamic.
 * Revalidates every hour — plenty fresh for a relatively static catalog.
 */
const getNavSpecies = unstable_cache(
  async () => {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from('plant_entities')
      .select('slug, canonical_name')
      .eq('curation_status', 'published')
      .order('canonical_name');
    return data ?? [];
  },
  ['nav-species'],
  { revalidate: 3600 }
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const species = await getNavSpecies();

  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <SkipNav />

        <header className="border-b border-gray-200">
          <nav
            className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"
            aria-label="Main navigation"
          >
            <Link href="/" className="text-xl font-bold text-green-800">
              Plant Commerce
            </Link>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/search" className="hover:text-green-700">
                Search
              </Link>

              {/* Species dropdown */}
              <div className="group relative">
                <button
                  className="flex items-center gap-1 hover:text-green-700"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Plants
                  <svg
                    className="h-3 w-3 transition-transform group-hover:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="invisible absolute right-0 top-full z-40 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg group-hover:visible">
                  {species.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/plants/${s.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
                    >
                      {s.canonical_name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/nurseries" className="hover:text-green-700">
                Nurseries
              </Link>
            </div>
          </nav>
        </header>

        <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">Plant Commerce</h3>
                <p className="text-xs text-gray-500">
                  Plant database and nursery inventory aggregator for the permaculture community.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">Browse</h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <Link href="/search" className="text-gray-500 hover:text-green-700">
                      Search
                    </Link>
                  </li>
                  <li>
                    <Link href="/nurseries" className="text-gray-500 hover:text-green-700">
                      Nurseries
                    </Link>
                  </li>
                  {species.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/plants/${s.slug}`} className="text-gray-500 hover:text-green-700">
                        {s.canonical_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-800">For Developers & Agents</h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <Link href="/api" className="text-gray-500 hover:text-green-700">
                      API Discovery
                    </Link>
                  </li>
                  <li>
                    <Link href="/llms.txt" className="text-gray-500 hover:text-green-700">
                      llms.txt
                    </Link>
                  </li>
                  <li>
                    <Link href="/llms-full.txt" className="text-gray-500 hover:text-green-700">
                      llms-full.txt (API Guide)
                    </Link>
                  </li>
                  <li>
                    <Link href="/sitemap.xml" className="text-gray-500 hover:text-green-700">
                      Sitemap
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
              Plant Commerce by Even Flow Nursery LLC
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
