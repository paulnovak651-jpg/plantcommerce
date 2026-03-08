import Link from 'next/link';
import type { CategoryGroup } from '@/lib/queries/plants';

const categoryColors: Record<string, { from: string; to: string }> = {
  'Nut Trees': { from: '#5C4033', to: '#3E2723' },
  'Apples & Crabapples': { from: '#558B2F', to: '#33691E' },
  Berries: { from: '#7B1FA2', to: '#4A148C' },
  'Cherries & Plums': { from: '#AD1457', to: '#880E4F' },
  Figs: { from: '#6D4C41', to: '#4E342E' },
  Grapes: { from: '#4A148C', to: '#311B92' },
  Mulberries: { from: '#C62828', to: '#B71C1C' },
  Pears: { from: '#9E9D24', to: '#827717' },
  Persimmons: { from: '#E65100', to: '#BF360C' },
  Quinces: { from: '#F9A825', to: '#F57F17' },
};

const defaultColor = { from: '#2d6a4f', to: '#1b4332' };

export function CategoryCard({ group }: { group: CategoryGroup }) {
  const colors = categoryColors[group.category] || defaultColor;

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
