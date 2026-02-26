import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import localFont from 'next/font/local';
import Link from 'next/link';
import { SkipNav } from '@/components/SkipNav';
import { MobileMenu } from '@/components/MobileMenu';
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${satoshi.variable}`}>
      <body className="bg-surface-ground text-text-primary antialiased">
        <SkipNav />

        <header className="relative border-b border-border-subtle bg-surface-raised">
          <nav
            className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
            aria-label="Main navigation"
          >
            <Link href="/" className="whitespace-nowrap font-serif text-xl font-semibold text-accent">
              Plant Commerce
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
              <Link href="/search" className="hover:text-accent">
                Search
              </Link>
              <Link href="/browse" className="hover:text-accent">
                Explore
              </Link>
              <Link href="/marketplace" className="hover:text-accent">
                Marketplace
              </Link>
              <Link href="/nurseries" className="hover:text-accent">
                Nurseries
              </Link>
            </div>

            {/* Mobile hamburger */}
            <MobileMenu />
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
                  Free plant comparison tool for the permaculture community.
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Built by Even Flow Nursery LLC in Cannon Falls, Minnesota.
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  All purchases happen directly on nursery websites.
                </p>
                <a
                  href="mailto:paul@evenflownursery.com"
                  className="mt-2 inline-block text-xs text-accent hover:text-accent-hover"
                >
                  Contact: paul@evenflownursery.com
                </a>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-text-primary">Explore</h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <Link href="/search" className="text-text-tertiary hover:text-accent">
                      Search
                    </Link>
                  </li>
                  <li>
                    <Link href="/browse" className="text-text-tertiary hover:text-accent">
                      Explore Plants
                    </Link>
                  </li>
                  <li>
                    <Link href="/marketplace" className="text-text-tertiary hover:text-accent">
                      Marketplace
                    </Link>
                  </li>
                  <li>
                    <Link href="/nurseries" className="text-text-tertiary hover:text-accent">
                      Nurseries
                    </Link>
                  </li>
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
