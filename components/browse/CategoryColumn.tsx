'use client';

import { useRef, useEffect } from 'react';
import type { TaxonomyTreeCategory } from '@/lib/queries/taxonomy-tree';
import { categoryColors, defaultColor } from '@/lib/category-colors';

interface CategoryColumnProps {
  categories: TaxonomyTreeCategory[];
  activeIndex: number | null;
  focused: boolean;
  onHover: (index: number) => void;
  onClick: (category: string) => void;
  onFocus: () => void;
}

export function CategoryColumn({
  categories,
  activeIndex,
  focused,
  onHover,
  onClick,
  onFocus,
}: CategoryColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view when changed via keyboard
  useEffect(() => {
    if (activeIndex == null || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className="flex flex-col h-full" onClick={onFocus}>
      <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
          Categories
        </span>
      </div>
      <div ref={listRef} className="overflow-y-auto flex-1">
        {categories.map((cat, i) => {
          const isActive = activeIndex === i;
          const colors = categoryColors[cat.category] ?? defaultColor;
          return (
            <button
              key={cat.category}
              type="button"
              data-index={i}
              className={`
                w-full text-left flex items-start gap-1.5 px-3 py-2
                transition-colors duration-150 cursor-pointer outline-none
                ${isActive
                  ? `bg-surface-inset ${focused ? 'ring-1 ring-inset ring-accent/30' : ''}`
                  : 'hover:bg-surface-inset/50'}
              `}
              onMouseEnter={() => onHover(i)}
              onClick={() => onClick(cat.category)}
              tabIndex={-1}
            >
              <span
                className="shrink-0 w-[3px] self-stretch rounded-full transition-colors duration-150"
                style={{ backgroundColor: isActive ? colors.from : 'transparent' }}
              />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-text-primary leading-tight truncate">
                  {cat.category}
                </div>
                <div className="text-[10px] text-text-tertiary leading-tight mt-0.5">
                  {cat.genera.length} genera · {cat.total_species} species
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
