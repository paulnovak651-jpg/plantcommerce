'use client';

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const wantedPages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sortedPages = [...wantedPages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const pages: Array<number | null> = [];
  for (let i = 0; i < sortedPages.length; i += 1) {
    const current = sortedPages[i];
    const previous = sortedPages[i - 1];
    if (i > 0 && previous != null && current - previous > 1) {
      pages.push(null);
    }
    pages.push(current);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {currentPage > 1 ? (
        <button onClick={() => onPageChange(currentPage - 1)} className="px-2 py-1 text-sm text-text-secondary hover:text-accent">&lsaquo;</button>
      ) : (
        <span className="px-2 py-1 text-sm text-text-tertiary">&lsaquo;</span>
      )}
      {pages.map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-2 py-1 text-sm text-text-tertiary">&hellip;</span>
        ) : p === currentPage ? (
          <span key={p} className="rounded bg-accent px-3 py-1 text-sm font-medium text-white">{p}</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} className="rounded px-3 py-1 text-sm text-text-secondary hover:bg-surface-inset hover:text-accent">{p}</button>
        )
      )}
      {currentPage < totalPages ? (
        <button onClick={() => onPageChange(currentPage + 1)} className="px-2 py-1 text-sm text-text-secondary hover:text-accent">&rsaquo;</button>
      ) : (
        <span className="px-2 py-1 text-sm text-text-tertiary">&rsaquo;</span>
      )}
    </nav>
  );
}
