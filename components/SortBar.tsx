'use client';

export function SortBar({
  total,
  page,
  perPage,
  sort,
  onSortChange,
}: {
  total: number;
  page: number;
  perPage: number;
  sort: string;
  onSortChange: (value: string) => void;
}) {
  const start = Math.min((page - 1) * perPage + 1, total);
  const end = Math.min(page * perPage, total);

  return (
    <div className="mb-6 flex items-center justify-between border-b border-border-subtle pb-4">
      <p className="text-sm text-text-secondary">
        {total === 0 ? 'No results' : `Showing ${start}\u2013${end} of ${total} plants`}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="sort-select" className="text-sm text-text-tertiary">
          Sort by
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded border border-border bg-surface-raised px-2 py-1 text-sm text-text-primary"
        >
          <option value="name-asc">Name A{'\u2013'}Z</option>
          <option value="name-desc">Name Z{'\u2013'}A</option>
          <option value="available">Most Available</option>
        </select>
      </div>
    </div>
  );
}
