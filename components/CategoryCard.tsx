import Link from 'next/link';
import type { CategoryGroup } from '@/lib/queries/plants';

export function CategoryCard({ group }: { group: CategoryGroup }) {
  return (
    <Link
      href={`/browse?category=${encodeURIComponent(group.category)}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] transition-opacity hover:opacity-90"
    >
      <div className="bg-gradient-to-br from-accent to-accent-hover p-5">
        <h3 className="font-serif text-lg font-semibold text-white">{group.category}</h3>
        <p className="mt-1 text-sm text-white/70">
          {group.species_count} species  {group.cultivar_count} cultivars
        </p>
        {group.nursery_count > 0 && (
          <p className="mt-0.5 text-xs text-white/50">
            {group.nursery_count} nurseries with stock
          </p>
        )}
      </div>
    </Link>
  );
}
