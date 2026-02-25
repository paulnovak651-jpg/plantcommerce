'use client';

import { useState, useEffect } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  placeholders?: string[];
}

const defaultPlaceholders = [
  "Search 'Jefferson Hazelnut'...",
  "Search 'zone 4 chestnuts'...",
  "Search 'bare root hazel'...",
  "Search 'EFB resistant'...",
];

export function SearchBar({
  defaultValue = '',
  placeholders = defaultPlaceholders,
}: SearchBarProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (placeholders.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % placeholders.length);
        setFade(true);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, [placeholders]);

  return (
    <form action="/search" method="GET" role="search" className="relative mx-auto w-full max-w-xl">
      <label htmlFor="search-input" className="sr-only">
        Search plants
      </label>
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholders[placeholderIndex]}
          className={`w-full rounded-[var(--radius-xl)] border-0 bg-surface-raised py-3.5 pl-12 pr-4 text-base text-text-primary shadow-md placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent transition-opacity duration-200 ${
            fade ? 'placeholder:opacity-100' : 'placeholder:opacity-0'
          }`}
        />
      </div>
    </form>
  );
}
