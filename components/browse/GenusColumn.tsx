'use client';

import { useRef, useEffect } from 'react';
import type { TaxonomyTreeGenus } from '@/lib/queries/taxonomy-tree';

interface GenusColumnProps {
  genera: TaxonomyTreeGenus[] | null;
  activeGenusSlug: string | null;
  focused: boolean;
  onHover: (genusSlug: string) => void;
  onClick: (genusSlug: string) => void;
  onFocus: () => void;
}

export function GenusColumn({
  genera,
  activeGenusSlug,
  focused,
  onHover,
  onClick,
  onFocus,
}: GenusColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view when changed via keyboard
  useEffect(() => {
    if (!activeGenusSlug || !listRef.current || !genera) return;
    const idx = genera.findIndex((g) => g.genus_slug === activeGenusSlug);
    if (idx < 0) return;
    const el = listRef.current.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeGenusSlug, genera]);

  if (!genera) {
    return (
      <div className="flex flex-col h-full" onClick={onFocus}>
        <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
          <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
            Genera
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[13px] text-text-tertiary text-center leading-snug">
            &larr; Select a category to see its genera
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" onClick={onFocus}>
      <div className="bg-surface-inset px-3 py-1.5 border-b border-border-subtle shrink-0">
        <span className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">
          Genera
        </span>
      </div>
      <div ref={listRef} className="overflow-y-auto flex-1">
        {genera.map((g) => {
          const isActive = activeGenusSlug === g.genus_slug;
          return (
            <button
              key={g.genus_slug}
              type="button"
              className={`
                w-full text-left px-3 py-2 flex items-center justify-between gap-1.5
                transition-colors duration-150 cursor-pointer outline-none
                ${isActive
                  ? `bg-surface-inset border-l-2 border-accent ${focused ? 'ring-1 ring-inset ring-accent/30' : ''}`
                  : 'hover:bg-surface-inset/50 border-l-2 border-transparent'}
              `}
              onMouseEnter={() => onHover(g.genus_slug)}
              onClick={() => onClick(g.genus_slug)}
              tabIndex={-1}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-text-primary leading-tight truncate">
                  {g.common_name}
                </div>
                <div className="text-[10px] text-text-tertiary italic leading-tight truncate mt-0.5">
                  {g.genus_name}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-text-tertiary leading-none">
                    {g.species_count} species · {g.cultivar_count} cultivars
                  </span>
                  {g.has_stock && (
                    <span className="bg-accent-light text-accent text-[9px] font-medium rounded-full px-1 py-px leading-none">
                      In Stock
                    </span>
                  )}
                </div>
              </div>
              <span className="text-text-tertiary text-[10px] shrink-0">&rsaquo;</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
