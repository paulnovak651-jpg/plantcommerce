'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { updateUnmatchedAction } from './actions';

interface ResolveFormProps {
  unmatchedId: string;
  token: string;
  currentStatus: string;
}

interface SearchResultItem {
  entity_type: 'cultivar' | 'plant_entity';
  entity_id: string;
  canonical_name: string;
  slug: string;
  context: string;
}

export function ResolveForm({ unmatchedId, token, currentStatus }: ResolveFormProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selected, setSelected] = useState<SearchResultItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (selected || debouncedQuery.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setOpen(true);

    fetch(`/api/admin/cultivar-search?q=${encodeURIComponent(debouncedQuery)}&token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) throw new Error(payload?.error?.message ?? 'Search failed');
        return (payload.data ?? []) as SearchResultItem[];
      })
      .then((items) => setResults(items))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(String(err));
        setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, selected, token]);

  const showDropdown = useMemo(
    () => !selected && open && debouncedQuery.length >= 2 && (loading || Boolean(error) || results.length > 0),
    [debouncedQuery.length, error, loading, open, results.length, selected]
  );

  return (
    <form action={updateUnmatchedAction} className="space-y-2" data-current-status={currentStatus}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="id" value={unmatchedId} />
      <input type="hidden" name="review_status" value="resolved" />
      <input type="hidden" name="resolved_to_type" value={selected?.entity_type ?? ''} />
      <input type="hidden" name="resolved_to_id" value={selected?.entity_id ?? ''} />

      <div ref={rootRef} className="relative">
        <label className="block text-xs text-text-secondary">
          Search cultivar or species
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Type at least 2 characters"
            className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
          />
        </label>

        {showDropdown && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-border bg-surface-primary shadow-lg">
            {loading && <div className="px-3 py-2 text-sm text-text-secondary">Searching...</div>}
            {!loading && error && <div className="px-3 py-2 text-sm text-red-600">{error}</div>}
            {!loading && !error && results.map((item) => (
              <button
                key={`${item.entity_type}-${item.entity_id}`}
                type="button"
                onClick={() => {
                  setSelected(item);
                  setQuery(item.canonical_name);
                  setOpen(false);
                }}
                className="w-full border-b border-border-subtle px-3 py-2 text-left last:border-b-0 hover:bg-surface-inset"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text-primary">{item.canonical_name}</span>
                  <span className="rounded bg-surface-inset px-2 py-0.5 text-[11px] text-text-secondary">
                    {item.entity_type === 'plant_entity' ? 'species' : 'cultivar'}
                  </span>
                </div>
                <div className="text-xs text-text-tertiary">{item.context}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-inset px-3 py-1 text-xs text-text-primary">
          <span>{selected.canonical_name} - {selected.entity_type === 'plant_entity' ? 'species' : 'cultivar'}</span>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setQuery('');
            }}
            className="font-bold text-text-secondary hover:text-text-primary"
          >
            x
          </button>
        </div>
      )}

      <label className="block text-xs text-text-secondary">
        Notes (optional)
        <textarea
          name="reviewer_notes"
          value={reviewerNotes}
          onChange={(event) => setReviewerNotes(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={!selected}
        className="rounded bg-accent px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        Resolve
      </button>
    </form>
  );
}
