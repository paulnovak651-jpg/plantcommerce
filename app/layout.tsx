import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import localFont from 'next/font/local';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import { SkipNav } from '@/components/SkipNav';
import { createAnonClient } from '@/lib/supabase/server';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Regular.woff2', weight: '400' },
    { path: '../public/fonts/Satoshi-Medium.woff2', weight: '500' },
    { path: '../public/fonts/Satoshi-Bold.woff2', weight: '700' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

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
    <html lang="en" className={`${fraunces.variable} ${satoshi.variable}`}>
      <body className="bg-surface-ground text-text-primary antialiased">
        <SkipNav />

        <header className="border-b border-border-subtle bg-surface-raised">
          <nav
            className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
            aria-label="Main navigation"
          >
            <Link href="/" className="font-serif text-xl font-semibold text-accent">
              Plant Commerce
            </Link>

            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <Link href="/search" className="hover:text-accent">
                Search
              </Link>
              <Link href="/browse" className="hover:text-accent">
                Browse
              </Link>

              {/* Species dropdown */}
              <div className="group relative">
                <button
                  className="flex items-center gap-1 hover:text-accent"
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
                <div className="invisible absolute right-0 top-full z-40 mt-1 min-w-[200px] rounded-[var(--radius-lg)] border border-border bg-surface-raised py-1 shadow-lg group-hover:visible">
                  {species.map((s: { slug: string; canonical_name: string }) => (
                    <Link
                      key={s.slug}
                      href={`/plants/${s.slug}`}
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-accent-subtle hover:text-accent"
                    >
                      {s.canonical_name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/nurseries" className="hover:text-accent">
                Nurseries
              </Link>
            </div>
          </nav>
        </header>

        <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-border-subtle bg-surface-primary">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <h3 className="mb-2 font-serif text-sm font-semibold text-text-primary">Plant Commerce</h3>
                <p className="text-xs text-text-tertiary">
                  Plant database and nursery inventory aggregator for the permaculture community.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-text-primary">Browse</h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <Link href="/search" className="text-text-tertiary hover:text-accent">
                      Search
                    </Link>
                  </li>
                  <li>
                    <Link href="/browse" className="text-text-tertiary hover:text-accent">
                      Browse by Taxonomy
                    </Link>
                  </li>
                  <li>
                    <Link href="/nurseries" className="text-text-tertiary hover:text-accent">
                      Nurseries
                    </Link>
                  </li>
                  {species.map((s: { slug: string; canonical_name: string }) => (
                    <li key={s.slug}>
                      <Link href={`/plants/${s.slug}`} className="text-text-tertiary hover:text-accent">
                        {s.canonical_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-text-primary">For Developers & Agents</h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <Link href="/api" className="text-text-tertiary hover:text-accent">
                      API Discovery
                    </Link>
                  </li>
                  <li>
                    <a href="/llms.txt" className="text-text-tertiary hover:text-accent">
                      llms.txt
                    </a>
                  </li>
                  <li>
                    <a href="/llms-full.txt" className="text-text-tertiary hover:text-accent">
                      llms-full.txt (API Guide)
                    </a>
                  </li>
                  <li>
                    <Link href="/sitemap.xml" className="text-text-tertiary hover:text-accent">
                      Sitemap
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-border-subtle pt-4 text-center text-xs text-text-tertiary">
              Plant Commerce by Even Flow Nursery LLC
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
