import Link from 'next/link';
import { JsonLd } from './JsonLd';

interface Crumb {
  label: string;
  href?: string;
}

const BASE_URL = 'https://plantcommerce.app';

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-green-700">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={jsonLd} />
    </>
  );
}
