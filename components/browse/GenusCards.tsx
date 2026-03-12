'use client';

import { Surface } from '@/components/ui/Surface';
import type { TopCategory } from '@/lib/browse-categories';
import type { GenusCount } from '@/lib/queries/genus-counts';

interface GenusCardsProps {
  category: TopCategory;
  genusCounts: Record<string, GenusCount>;
  onGenusSelect: (genusSlug: string) => void;
}

export function GenusCards({ category, genusCounts, onGenusSelect }: GenusCardsProps) {
  return (
    <div className="flex flex-col gap-3">
      {category.genera.map((genus) => {
        const counts = genusCounts[genus.genusSlug];
        const isEmpty = !counts || counts.speciesCount === 0;

        return (
          <div
            key={genus.genusSlug}
            className={`group cursor-pointer ${isEmpty ? 'opacity-50' : ''}`}
            onClick={() => !isEmpty && onGenusSelect(genus.genusSlug)}
          >
            <Surface
              elevation="raised"
              padding="compact"
              className="border-l-[3px] transition-shadow duration-200 hover:shadow-md"
              style={{ borderLeftColor: category.color }}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-base font-semibold text-text-primary">
                  {genus.commonName}
                </h4>
                {isEmpty && (
                  <span className="rounded-full bg-surface-inset px-2 py-0.5 text-xs text-text-tertiary">
                    Coming Soon
                  </span>
                )}
              </div>

              <p className="text-xs text-text-tertiary mt-0.5">
                <span className="italic">{genus.botanicalName}</span>
                {!isEmpty && counts && (
                  <>
                    {' · '}
                    {counts.speciesCount} {counts.speciesCount === 1 ? 'species' : 'species'}
                    {' · '}
                    {counts.cultivarCount} {counts.cultivarCount === 1 ? 'cultivar' : 'cultivars'}
                    {' · '}
                    {counts.nurseryCount} {counts.nurseryCount === 1 ? 'nursery' : 'nurseries'}
                  </>
                )}
              </p>

              {/* Revealed on hover (desktop) — additional detail */}
              {!isEmpty && (
                <div className="overflow-hidden transition-all duration-200 ease-out max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100">
                  <p className="text-sm text-text-secondary pt-2">
                    Browse all {genus.commonName.toLowerCase()} cultivars available from our nursery partners
                  </p>
                </div>
              )}
            </Surface>
          </div>
        );
      })}
    </div>
  );
}
