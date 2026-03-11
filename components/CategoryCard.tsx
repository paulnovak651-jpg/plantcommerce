'use client';

import Link from 'next/link';
import type { CategoryGroup } from '@/lib/queries/plants';
import { categoryColors, defaultColor } from '@/lib/category-colors';

export function CategoryCard({ group }: { group: CategoryGroup }) {
  const colors = categoryColors[group.category] || defaultColor;
  const hasGenera = group.top_genera && group.top_genera.length > 0;

  return (
    <Link
      href={`/browse?category=${encodeURIComponent(group.category)}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] transition-opacity hover:opacity-90"
    >
      <div
        className="p-5"
        style={{ background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})` }}
      >
        <h3 className="font-serif text-lg font-semibold text-white">{group.category}</h3>
        <p className="mt-1 text-sm text-white/70">
          {group.species_count} species &middot; {group.cultivar_count} cultivars
        </p>
        {group.nursery_count > 0 && (
          <p className="mt-0.5 text-xs text-white/50">
            {group.nursery_count} nurseries with stock
          </p>
        )}
        {hasGenera && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {group.top_genera.map((g) => (
              <button
                key={g.slug}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/plants/genus/${g.slug}`;
                }}
                className="inline-block cursor-pointer rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/25"
              >
                {g.common_name}
                {g.species_count > 1 && (
                  <span className="ml-1 text-white/60">({g.species_count})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
