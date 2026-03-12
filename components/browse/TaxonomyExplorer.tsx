'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TaxonomyTree } from '@/lib/queries/taxonomy-tree';
import { CategoryColumn } from '@/components/browse/CategoryColumn';
import { GenusColumn } from '@/components/browse/GenusColumn';
import {
  GenusPreviewPanel,
  type GenusPreviewData,
} from '@/components/browse/GenusPreviewPanel';
import { categoryColors, defaultColor } from '@/lib/category-colors';

interface TaxonomyExplorerProps {
  taxonomyTree: TaxonomyTree;
}

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

function useSpeciesFetcher() {
  const cacheRef = useRef(new Map<string, GenusPreviewData>());

  const fetchSpecies = useCallback(
    async (
      slug: string,
      setData: (d: GenusPreviewData) => void,
      setLoading: (l: boolean) => void
    ) => {
      const cached = cacheRef.current.get(slug);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/taxonomy/genus/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            cacheRef.current.set(slug, json.data);
            setData(json.data);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { fetchSpecies, cacheRef };
}

// ---------------------------------------------------------------------------
// Mobile drill-down
// ---------------------------------------------------------------------------

function MobileDrillDown({ taxonomyTree }: TaxonomyExplorerProps) {
  const [depth, setDepth] = useState(0);
  const [catIndex, setCatIndex] = useState(0);
  const [genusSlug, setGenusSlug] = useState<string | null>(null);
  const [speciesData, setSpeciesData] = useState<GenusPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const { fetchSpecies } = useSpeciesFetcher();

  const activeCategory = taxonomyTree.categories[catIndex];
  const activeGenus = activeCategory?.genera.find(
    (g) => g.genus_slug === genusSlug
  );

  const header = (() => {
    if (depth === 0) return null;
    if (depth === 1) {
      return (
        <button
          type="button"
          onClick={() => setDepth(0)}
          className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-surface-primary w-full text-left cursor-pointer"
        >
          <span className="text-text-tertiary text-sm">&larr;</span>
          <span className="text-[13px] font-medium text-text-primary">
            Genera in {activeCategory?.category}
          </span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => { setDepth(1); setSpeciesData(null); }}
        className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-surface-primary w-full text-left cursor-pointer"
      >
        <span className="text-text-tertiary text-sm">&larr;</span>
        <span className="text-[13px] font-medium text-text-primary">
          {activeGenus?.common_name ?? 'Back'}
        </span>
      </button>
    );
  })();

  return (
    <div className="border border-border-subtle rounded-[var(--radius-lg)] bg-surface-primary overflow-hidden">
      {header}

      {/* Depth 0: Categories */}
      {depth === 0 && (
        <div>
          {taxonomyTree.categories.map((cat, i) => {
            const colors = categoryColors[cat.category] ?? defaultColor;
            return (
              <button
                key={cat.category}
                type="button"
                className="w-full text-left flex items-start gap-2 px-4 py-2.5 border-b border-border-subtle last:border-b-0 hover:bg-surface-inset/50 active:bg-surface-inset transition-colors cursor-pointer"
                onClick={() => { setCatIndex(i); setDepth(1); }}
              >
                <span
                  className="shrink-0 w-[3px] self-stretch rounded-full"
                  style={{ backgroundColor: colors.from }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text-primary">{cat.category}</div>
                  <div className="text-[10px] text-text-tertiary">
                    {cat.genera.length} genera · {cat.total_species} species
                  </div>
                </div>
                <span className="text-text-tertiary text-xs self-center">&rsaquo;</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Depth 1: Genera */}
      {depth === 1 && activeCategory && (
        <div>
          {activeCategory.genera.map((g) => (
            <button
              key={g.genus_slug}
              type="button"
              className="w-full text-left px-4 py-2.5 border-b border-border-subtle last:border-b-0 hover:bg-surface-inset/50 active:bg-surface-inset transition-colors cursor-pointer"
              onClick={() => {
                setGenusSlug(g.genus_slug);
                setDepth(2);
                fetchSpecies(g.genus_slug, setSpeciesData, setLoading);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-text-primary">
                    {g.common_name}
                  </div>
                  <div className="text-[10px] text-text-tertiary italic">
                    {g.genus_name} · {g.species_count} species
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {g.has_stock && (
                    <span className="bg-accent-light text-accent text-[9px] font-medium rounded-full px-1 py-px leading-none">
                      In Stock
                    </span>
                  )}
                  <span className="text-text-tertiary text-xs">&rsaquo;</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Depth 2: Species */}
      {depth === 2 && (
        <GenusPreviewPanel data={speciesData} loading={loading} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop 3-column explorer with keyboard navigation
// ---------------------------------------------------------------------------

type FocusedColumn = 'categories' | 'genera' | 'species';

function DesktopExplorer({ taxonomyTree }: TaxonomyExplorerProps) {
  const router = useRouter();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [activeGenusSlug, setActiveGenusSlug] = useState<string | null>(null);
  const [speciesPreview, setSpeciesPreview] = useState<GenusPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [focusedColumn, setFocusedColumn] = useState<FocusedColumn>('categories');

  const categoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fetchSpecies } = useSpeciesFetcher();

  const categories = taxonomyTree.categories;
  const activeCategory =
    activeCategoryIndex != null ? categories[activeCategoryIndex] : null;
  const genera = activeCategory?.genera ?? null;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current);
      if (genusTimerRef.current) clearTimeout(genusTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Hover handlers (with 150ms debounce)
  // ---------------------------------------------------------------------------

  const handleCategoryHover = useCallback((index: number) => {
    if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current);
    categoryTimerRef.current = setTimeout(() => {
      setActiveCategoryIndex(index);
      setActiveGenusSlug(null);
      setSpeciesPreview(null);
    }, 150);
  }, []);

  const handleGenusHover = useCallback(
    (genusSlug: string) => {
      if (genusTimerRef.current) clearTimeout(genusTimerRef.current);
      genusTimerRef.current = setTimeout(() => {
        setActiveGenusSlug(genusSlug);
        fetchSpecies(genusSlug, setSpeciesPreview, setLoadingPreview);
      }, 150);
    },
    [fetchSpecies]
  );

  // ---------------------------------------------------------------------------
  // Click handlers
  // ---------------------------------------------------------------------------

  const handleCategoryClick = useCallback(
    (category: string) => {
      router.push(`/?category=${encodeURIComponent(category)}`);
    },
    [router]
  );

  const handleGenusClick = useCallback(
    (genusSlug: string) => {
      const slug = genusSlug.replace(/^genus-/, '');
      router.push(`/plants/genus/${slug}`);
    },
    [router]
  );

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------

  const getActiveGenusIndex = useCallback((): number => {
    if (!genera || !activeGenusSlug) return -1;
    return genera.findIndex((g) => g.genus_slug === activeGenusSlug);
  }, [genera, activeGenusSlug]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key } = e;

      // Only handle arrow keys and enter
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) return;
      e.preventDefault();

      if (focusedColumn === 'categories') {
        if (key === 'ArrowDown') {
          const next = activeCategoryIndex == null ? 0 : Math.min(activeCategoryIndex + 1, categories.length - 1);
          setActiveCategoryIndex(next);
          setActiveGenusSlug(null);
          setSpeciesPreview(null);
        } else if (key === 'ArrowUp') {
          const next = activeCategoryIndex == null ? 0 : Math.max(activeCategoryIndex - 1, 0);
          setActiveCategoryIndex(next);
          setActiveGenusSlug(null);
          setSpeciesPreview(null);
        } else if (key === 'ArrowRight' && genera && genera.length > 0) {
          setFocusedColumn('genera');
          if (!activeGenusSlug) {
            const first = genera[0];
            setActiveGenusSlug(first.genus_slug);
            fetchSpecies(first.genus_slug, setSpeciesPreview, setLoadingPreview);
          }
        } else if (key === 'Enter' && activeCategoryIndex != null) {
          handleCategoryClick(categories[activeCategoryIndex].category);
        }
      } else if (focusedColumn === 'genera') {
        const idx = getActiveGenusIndex();
        if (key === 'ArrowDown' && genera) {
          const next = idx < 0 ? 0 : Math.min(idx + 1, genera.length - 1);
          const g = genera[next];
          setActiveGenusSlug(g.genus_slug);
          fetchSpecies(g.genus_slug, setSpeciesPreview, setLoadingPreview);
        } else if (key === 'ArrowUp' && genera) {
          const next = idx < 0 ? 0 : Math.max(idx - 1, 0);
          const g = genera[next];
          setActiveGenusSlug(g.genus_slug);
          fetchSpecies(g.genus_slug, setSpeciesPreview, setLoadingPreview);
        } else if (key === 'ArrowLeft') {
          setFocusedColumn('categories');
        } else if (key === 'ArrowRight' && speciesPreview) {
          setFocusedColumn('species');
        } else if (key === 'Enter' && activeGenusSlug) {
          handleGenusClick(activeGenusSlug);
        }
      } else if (focusedColumn === 'species') {
        if (key === 'ArrowLeft') {
          setFocusedColumn('genera');
        }
        // Column 3 is link-based — users navigate via Tab/click within it
      }
    },
    [
      focusedColumn, activeCategoryIndex, activeGenusSlug,
      categories, genera, speciesPreview,
      getActiveGenusIndex, fetchSpecies,
      handleCategoryClick, handleGenusClick,
    ]
  );

  return (
    <div
      ref={containerRef}
      className="border border-border-subtle rounded-[var(--radius-lg)] bg-surface-primary overflow-hidden grid focus:outline-none"
      style={{
        gridTemplateColumns: '200px 250px 1fr',
        minHeight: '480px',
        maxHeight: '600px',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="treegrid"
      aria-label="Plant taxonomy explorer"
    >
      {/* Column 1: Categories */}
      <div className="border-r border-border-subtle flex flex-col overflow-hidden">
        <CategoryColumn
          categories={categories}
          activeIndex={activeCategoryIndex}
          focused={focusedColumn === 'categories'}
          onHover={handleCategoryHover}
          onClick={handleCategoryClick}
          onFocus={() => setFocusedColumn('categories')}
        />
      </div>

      {/* Column 2: Genera */}
      <div className="border-r border-border-subtle flex flex-col overflow-hidden">
        <GenusColumn
          genera={genera}
          activeGenusSlug={activeGenusSlug}
          focused={focusedColumn === 'genera'}
          onHover={handleGenusHover}
          onClick={handleGenusClick}
          onFocus={() => setFocusedColumn('genera')}
        />
      </div>

      {/* Column 3: Species preview */}
      <div
        className="flex flex-col overflow-y-auto overflow-x-hidden"
        onClick={() => setFocusedColumn('species')}
      >
        <GenusPreviewPanel data={speciesPreview} loading={loadingPreview} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component: responsive switch
// ---------------------------------------------------------------------------

export function TaxonomyExplorer({ taxonomyTree }: TaxonomyExplorerProps) {
  if (taxonomyTree.categories.length === 0) {
    return (
      <div className="border border-border-subtle rounded-[var(--radius-lg)] bg-surface-primary p-8 text-center">
        <p className="text-[13px] text-text-tertiary">
          No plant categories found. Try the Refine view for full catalog access.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: 3-column (lg and up) */}
      <div className="hidden lg:block">
        <DesktopExplorer taxonomyTree={taxonomyTree} />
      </div>
      {/* Mobile: drill-down (below lg) */}
      <div className="lg:hidden">
        <MobileDrillDown taxonomyTree={taxonomyTree} />
      </div>
    </>
  );
}
