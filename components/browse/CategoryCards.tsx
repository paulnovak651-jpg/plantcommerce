'use client';

import { Surface } from '@/components/ui/Surface';
import { TOP_CATEGORIES } from '@/lib/browse-categories';

interface CategoryCardsProps {
  onCategorySelect: (slug: string) => void;
}

export function CategoryCards({ onCategorySelect }: CategoryCardsProps) {
  return (
    <div className="flex flex-col gap-3">
      {TOP_CATEGORIES.map((cat) => (
        <div
          key={cat.slug}
          className="group cursor-pointer"
          onClick={() => onCategorySelect(cat.slug)}
        >
          <Surface
            elevation="raised"
            padding="compact"
            className={`border-l-4 transition-shadow duration-200 hover:shadow-md`}
            style={{ borderLeftColor: cat.color }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                {cat.label}
              </h3>
            </div>

            {/* Revealed on hover (desktop) — genera list */}
            <div className="overflow-hidden transition-all duration-200 ease-out max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100">
              <p className="text-sm text-text-secondary pt-2">
                {cat.genera.map((g) => g.commonName).join(' · ')}
              </p>
            </div>
          </Surface>
        </div>
      ))}
    </div>
  );
}
