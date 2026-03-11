'use client';

import type { FilterPill } from './ActiveFilterPills';
import type { RecoveryHint } from '@/lib/queries/facet-query-builder';

interface SmartEmptyStateProps {
  /** Active filter pills — shown so user can see what's narrowing results */
  activePills: FilterPill[];
  /** Clear all filters */
  onClearAll: () => void;
  /** Whether we're in genus-grouped view */
  genusView?: boolean;
  /** Server-computed recovery hints showing which filters to remove */
  recoveryHints?: RecoveryHint[];
}

/**
 * Recovery-focused empty state for zero-result filter combinations.
 * Shows what filters are active, suggests which to remove based on
 * server-computed counts, and helps the user recover.
 *
 * Design: warm amber tones (not error-red), helpful not punishing.
 */
export function SmartEmptyState({
  activePills,
  onClearAll,
  genusView,
  recoveryHints = [],
}: SmartEmptyStateProps) {
  const noun = genusView ? 'genera' : 'plants';

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised px-6 py-12 text-center">
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-inset">
        <svg className="h-6 w-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      <p className="text-lg font-serif font-semibold text-text-primary">
        No {noun} match this combination
      </p>

      {activePills.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-text-secondary">
            Your active filters:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {activePills.map((pill) => (
              <button
                key={pill.label}
                onClick={pill.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-primary px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
              >
                {pill.label}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {recoveryHints.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-left dark:border-amber-800/40 dark:bg-amber-900/10">
          <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            Try removing a filter to see results:
          </p>
          <ul className="space-y-1">
            {recoveryHints.slice(0, 3).map((hint) => (
              <li key={hint.facetKey} className="text-sm text-amber-700 dark:text-amber-400">
                Remove <span className="font-medium">{hint.label}</span> to see{' '}
                <span className="font-semibold">{hint.resultCount}</span>{' '}
                {hint.resultCount === 1 ? 'result' : 'results'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recoveryHints.length === 0 && activePills.length > 0 && (
        <p className="mt-3 text-sm text-text-tertiary">
          Try removing a filter to broaden results.
        </p>
      )}

      <div className="mt-5">
        <button
          onClick={onClearAll}
          className="rounded-[var(--radius-md)] bg-accent px-5 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-accent-hover"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}
