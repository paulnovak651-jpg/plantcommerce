import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import localFont from 'next/font/local';
import Link from 'next/link';
import { SkipNav } from '@/components/SkipNav';
import { MobileMenu } from '@/components/MobileMenu';
import { NavLinks } from '@/components/NavLinks';
import { ZonePrompt } from '@/components/ZonePrompt';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { HeaderSearch } from '@/components/HeaderSearch';
import { CompareProvider } from '@/components/compare/CompareContext';
import { CompareTray } from '@/components/compare/CompareTray';
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

        <header className="border-b border-border-subtle">
          {/* Tier 1: Logo bar */}
          <div className="bg-surface-raised">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <div className="hidden md:block w-56 lg:w-72">
                <HeaderSearch />
              </div>

              <Link href="/" className="whitespace-nowrap font-serif text-2xl font-semibold text-accent">
                Plant Commerce
              </Link>

              <div className="hidden items-center gap-4 text-xs text-text-tertiary md:flex">
                <ZonePrompt />
                <Link href="/nurseries" className="uppercase tracking-wide hover:text-accent">Nurseries</Link>
              </div>

              <MobileMenu />
            </div>
          </div>

          {/* Tier 2: Main navigation */}
          <nav className="bg-surface-primary" aria-label="Main navigation">
            <div className="mx-auto hidden max-w-7xl items-center justify-center gap-8 px-4 py-3 md:flex">
              <NavLinks />
            </div>
          </nav>
        </header>

        <CompareProvider>
        <ToastProvider>
        <main id="main-content" className="page-enter">
          {children}
        </main>
        </ToastProvider>
        <CompareTray />
        </CompareProvider>

        <footer className="bg-accent">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-inverse">Plant Commerce</h3>
                <p className="mt-2 text-sm text-text-inverse/60">
                  Free plant comparison tool for the permaculture community.
                </p>
                <p className="mt-1 text-sm text-text-inverse/60">
                  Built by Even Flow Nursery LLC in Cannon Falls, Minnesota.
                </p>
                <a
                  href="mailto:paul@evenflownursery.com"
                  className="mt-3 inline-block text-sm text-text-inverse/70 hover:text-text-inverse"
                >
                  paul@evenflownursery.com
                </a>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-inverse">Browse</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/" className="text-text-inverse/70 hover:text-text-inverse">Browse Plants</Link></li>
                  <li><Link href="/marketplace" className="text-text-inverse/70 hover:text-text-inverse">Marketplace</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-inverse">Resources</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/nurseries" className="text-text-inverse/70 hover:text-text-inverse">Nurseries</Link></li>
                  <li><Link href="/api" className="text-text-inverse/70 hover:text-text-inverse">API Discovery</Link></li>
                  <li><a href="/llms.txt" className="text-text-inverse/70 hover:text-text-inverse">llms.txt</a></li>
                  <li><Link href="/sitemap.xml" className="text-text-inverse/70 hover:text-text-inverse">Sitemap</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-inverse">For Developers</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><a href="/llms-full.txt" className="text-text-inverse/70 hover:text-text-inverse">llms-full.txt (API Guide)</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-text-inverse/20 pt-4 text-center text-xs text-text-inverse/40">
              Plant Commerce by Even Flow Nursery LLC
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
