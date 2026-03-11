'use client';

export interface FilterPill {
  label: string;
  onRemove: () => void;
}

interface ActiveFilterPillsProps {
  pills: FilterPill[];
  onClearAll: () => void;
}

/**
 * Removable filter pills shown above browse results.
 * Each pill represents one active filter with an × to remove it.
 * "Clear all" link appears at the end.
 */
export function ActiveFilterPills({ pills, onClearAll }: ActiveFilterPillsProps) {
  if (pills.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {pills.map((pill) => (
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
      <button
        onClick={onClearAll}
        className="text-xs text-accent hover:text-accent-hover"
      >
        Clear all
      </button>
    </div>
  );
}
