'use client';

interface BrowseBreadcrumbProps {
  step: 'categories' | 'genera' | 'cultivars';
  categoryLabel?: string;
  genusLabel?: string;
  onNavigate: (step: 'categories' | 'genera') => void;
}

export function BrowseBreadcrumb({
  step,
  categoryLabel,
  genusLabel,
  onNavigate,
}: BrowseBreadcrumbProps) {
  if (step === 'categories') return null;

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm">
      <button
        onClick={() => onNavigate('categories')}
        className="flex items-center gap-0.5 text-text-tertiary hover:text-accent transition-colors"
      >
        <span aria-hidden="true">&larr;</span>
        All Categories
      </button>

      {categoryLabel && (
        <>
          <span className="text-text-tertiary">/</span>
          {step === 'cultivars' ? (
            <button
              onClick={() => onNavigate('genera')}
              className="text-text-tertiary hover:text-accent transition-colors"
            >
              {categoryLabel}
            </button>
          ) : (
            <span className="text-text-primary font-medium">{categoryLabel}</span>
          )}
        </>
      )}

      {step === 'cultivars' && genusLabel && (
        <>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-primary font-medium">{genusLabel}</span>
        </>
      )}
    </nav>
  );
}
