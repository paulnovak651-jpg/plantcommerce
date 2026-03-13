'use client';

import { useState, useCallback } from 'react';
import { TOP_CATEGORIES } from '@/lib/browse-categories';
import type { GenusCount } from '@/lib/queries/genus-counts';

interface CategoryTreeSidebarProps {
  /** Currently selected top category slug, e.g. 'nut-trees' */
  selectedCategory: string | null;
  /** Currently selected genus slug, e.g. 'corylus' */
  selectedGenus: string | null;
  /** Genus-level counts from getGenusCounts (species, cultivars, nurseries per genus) */
  genusCounts: Record<string, GenusCount>;
  /** Called when user clicks a top category */
  onCategorySelect: (slug: string | null) => void;
  /** Called when user clicks a genus within a category */
  onGenusSelect: (genusSlug: string | null) => void;
}

export function CategoryTreeSidebar({
  selectedCategory,
  selectedGenus,
  genusCounts,
  onCategorySelect,
  onGenusSelect,
}: CategoryTreeSidebarProps) {
  // Track which categories are expanded (accordion-style)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (selectedCategory) initial.add(selectedCategory);
    return initial;
  });

  const toggleExpand = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleCategoryClick = useCallback(
    (slug: string) => {
      // Toggle expansion
      toggleExpand(slug);
      // If clicking the already-selected category, deselect it (show all)
      if (selectedCategory === slug) {
        onCategorySelect(null);
        onGenusSelect(null);
      } else {
        onCategorySelect(slug);
        onGenusSelect(null); // Clear genus when switching categories
      }
    },
    [selectedCategory, onCategorySelect, onGenusSelect, toggleExpand]
  );

  const handleGenusClick = useCallback(
    (genusSlug: string) => {
      if (selectedGenus === genusSlug) {
        onGenusSelect(null); // Deselect genus — show all in category
      } else {
        onGenusSelect(genusSlug);
      }
    },
    [selectedGenus, onGenusSelect]
  );

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        Browse by Category
      </h3>

      {/* "All Categories" link to clear selection */}
      <button
        type="button"
        onClick={() => {
          onCategorySelect(null);
          onGenusSelect(null);
        }}
        className={`mb-2 block w-full text-left text-sm font-medium transition-colors cursor-pointer ${
          selectedCategory === null
            ? 'text-accent'
            : 'text-text-secondary hover:text-accent'
        }`}
      >
        All Categories
      </button>

      <div className="space-y-1">
        {TOP_CATEGORIES.map((cat) => {
          const isExpanded = expanded.has(cat.slug);
          const isSelected = selectedCategory === cat.slug;

          return (
            <div key={cat.slug}>
              {/* Category row */}
              <button
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-accent-light text-accent'
                    : 'text-text-primary hover:bg-surface-raised hover:text-accent'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.label}</span>
                <svg
                  className={`h-4 w-4 text-text-tertiary transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>

              {/* Genus sub-items (animated expand/collapse) */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-4 border-l border-border-subtle pl-3 py-1 space-y-0.5">
                  {cat.genera.map((genus) => {
                    const counts = genusCounts[genus.genusSlug];
                    const isEmpty = !counts || counts.speciesCount === 0;
                    const isGenusSelected = selectedGenus === genus.genusSlug;

                    return (
                      <button
                        key={genus.genusSlug}
                        type="button"
                        disabled={isEmpty}
                        onClick={() => !isEmpty && handleGenusClick(genus.genusSlug)}
                        className={`block w-full text-left rounded-md px-2 py-1 text-sm transition-colors ${
                          isEmpty
                            ? 'text-text-tertiary/50 cursor-default'
                            : isGenusSelected
                            ? 'bg-accent-light text-accent font-medium'
                            : 'text-text-secondary hover:bg-surface-raised hover:text-accent cursor-pointer'
                        }`}
                      >
                        <span>{genus.commonName}</span>
                        {!isEmpty && counts && (
                          <span className="ml-1 text-xs text-text-tertiary">
                            ({counts.cultivarCount})
                          </span>
                        )}
                        {isEmpty && (
                          <span className="ml-1 text-xs text-text-tertiary/50">
                            soon
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
