'use client';

import Link from 'next/link';
import { useCompare } from '@/components/compare/CompareContext';

export function CompareTray() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-raised shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent-light px-3 py-1 text-sm text-accent shrink-0"
            >
              {item.name}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="ml-1 text-accent/60 hover:text-accent cursor-pointer"
                aria-label={`Remove ${item.name} from comparison`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="text-sm text-text-tertiary hover:text-text-secondary cursor-pointer"
          >
            Clear
          </button>
          <Link
            href={`/compare?ids=${items.map((i) => i.id).join(',')}`}
            className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-hover transition-colors"
          >
            Compare {items.length}
          </Link>
        </div>
      </div>
    </div>
  );
}
