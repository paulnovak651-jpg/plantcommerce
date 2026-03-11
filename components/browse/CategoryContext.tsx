'use client';

import { categoryColors, defaultColor } from '@/lib/category-colors';

interface CategoryContextProps {
  category: string;
  total: number;
  onClear: () => void;
}

export function CategoryContext({ category, total, onClear }: CategoryContextProps) {
  const colors = categoryColors[category] ?? defaultColor;

  return (
    <div
      className="mb-4 flex items-center justify-between rounded-[var(--radius-lg)] px-4 py-3"
      style={{ background: `linear-gradient(to right, ${colors.from}, ${colors.to})` }}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-base font-semibold text-white">{category}</span>
        <span className="text-xs text-white/70">
          {total} {total === 1 ? 'result' : 'results'}
        </span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        &times; Clear
      </button>
    </div>
  );
}
