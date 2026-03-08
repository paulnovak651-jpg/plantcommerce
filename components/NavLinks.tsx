'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/browse', label: 'Browse' },
  { href: '/search', label: 'Search' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/nurseries', label: 'Nurseries' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-center gap-8">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        const className = isActive
          ? 'border-b-2 border-accent pb-0.5 text-sm font-medium uppercase tracking-widest text-accent hover:text-accent'
          : 'text-sm font-medium uppercase tracking-widest text-text-secondary hover:text-accent';

        return (
          <Link key={link.href} href={link.href} className={className} aria-current={isActive ? 'page' : undefined}>
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
