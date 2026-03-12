'use client';

import { useState, useEffect, useMemo, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

type SuggestionType = 'genus' | 'species' | 'cultivar';

interface AutocompleteSuggestion {
  name: string;
  slug: string;
  type: SuggestionType;
  speciesSlug?: string;
  matchedAlias?: string;
}

interface SearchBarProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  action?: string;
  className?: string;
  inputId?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
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
  value,
  onValueChange,
  action = '/',
  className,
  inputId = 'search-input',
  onSubmit,
  placeholders = defaultPlaceholders,
}: SearchBarProps) {
  const router = useRouter();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue.trim());
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value != null;
  const currentValue = isControlled ? value : internalValue;

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

  useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(currentValue.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [currentValue]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const q = debouncedQuery.toLowerCase();
    if (q.length < 3) {
      setSuggestions([]);
      setActiveIndex(-1);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setHasSearched(false);

    fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error?.message ?? 'Autocomplete request failed');
        }
        return (payload.data ?? []) as AutocompleteSuggestion[];
      })
      .then((items) => {
        setSuggestions(items);
        if (document.activeElement === inputRef.current) {
          setDropdownOpen(true);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasSearched(true);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const grouped = useMemo(() => ({
    genera: suggestions.filter((item) => item.type === 'genus'),
    species: suggestions.filter((item) => item.type === 'species'),
    cultivars: suggestions.filter((item) => item.type === 'cultivar'),
  }), [suggestions]);

  const orderedSuggestions = useMemo(
    () => [...grouped.genera, ...grouped.species, ...grouped.cultivars],
    [grouped]
  );

  useEffect(() => {
    setActiveIndex((current) => (current >= orderedSuggestions.length ? -1 : current));
  }, [orderedSuggestions.length]);

  const showDropdown =
    dropdownOpen &&
    debouncedQuery.length >= 3 &&
    (loading || orderedSuggestions.length > 0 || hasSearched);

  function suggestionHref(item: AutocompleteSuggestion): string {
    if (item.type === 'genus') {
      return `/plants/genus/${item.slug}`;
    }
    if (item.type === 'species') {
      return `/plants/${item.slug}`;
    }
    if (item.speciesSlug) {
      return `/plants/${item.speciesSlug}/${item.slug}`;
    }
    return `/?q=${encodeURIComponent(item.name)}`;
  }

  function selectSuggestion(item: AutocompleteSuggestion) {
    if (!isControlled) {
      setInternalValue(item.name);
    }
    onValueChange?.(item.name);
    setDropdownOpen(false);
    setActiveIndex(-1);
    router.push(suggestionHref(item));
  }

  function handleChange(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    if (nextValue.trim().length < 3) {
      setDropdownOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      setHasSearched(false);
    } else {
      setDropdownOpen(true);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setDropdownOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!showDropdown || orderedSuggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % orderedSuggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? orderedSuggestions.length - 1 : current - 1
      );
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(orderedSuggestions[activeIndex]);
    }
  }

  function renderGroup(label: string, items: AutocompleteSuggestion[], startIndex: number) {
    if (items.length === 0) return null;

    return (
      <div key={label}>
        <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          {label}
        </div>
        {items.map((item, index) => {
          const overallIndex = startIndex + index;
          const isActive = overallIndex === activeIndex;
          return (
            <button
              key={`${item.type}-${item.slug}-${item.speciesSlug ?? ''}`}
              type="button"
              id={`${inputId}-option-${overallIndex}`}
              role="option"
              aria-selected={isActive}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(item);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                isActive
                  ? 'bg-surface-inset text-text-primary'
                  : 'text-text-secondary hover:bg-surface-inset'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="truncate block">{item.name}</span>
                {item.matchedAlias && (
                  <span className="truncate block text-xs text-text-tertiary">
                    also known as: {item.matchedAlias}
                  </span>
                )}
              </span>
              <span className="ml-3 shrink-0 rounded bg-surface-inset px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                {item.type}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <form
      action={action}
      method="GET"
      role="search"
      onSubmit={onSubmit}
      className={className ?? 'relative mx-auto w-full max-w-xl'}
    >
      <label htmlFor={inputId} className="sr-only">
        Search plants
      </label>
      <div ref={rootRef} className="relative">
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
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (currentValue.trim().length >= 3) {
              setDropdownOpen(true);
            }
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholders[placeholderIndex]}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={`${inputId}-autocomplete`}
          aria-activedescendant={
            activeIndex >= 0
              ? `${inputId}-option-${activeIndex}`
              : undefined
          }
          className={`w-full rounded-[var(--radius-xl)] border-0 bg-surface-raised py-3.5 pl-12 pr-4 text-base text-text-primary shadow-md placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent transition-opacity duration-200 ${
            fade ? 'placeholder:opacity-100' : 'placeholder:opacity-0'
          }`}
        />

        {showDropdown && (
          <div
            id={`${inputId}-autocomplete`}
            role="listbox"
            className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-[var(--radius-lg)] border border-border-subtle bg-surface-primary py-1 shadow-xl"
          >
            {loading && (
              <div className="px-3 py-2 text-sm text-text-tertiary">Searching...</div>
            )}
            {!loading && orderedSuggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-tertiary">
                No matches found.
              </div>
            )}
            {!loading && orderedSuggestions.length > 0 && (
              <>
                {renderGroup('Genera', grouped.genera, 0)}
                {renderGroup('Species', grouped.species, grouped.genera.length)}
                {renderGroup(
                  'Cultivars',
                  grouped.cultivars,
                  grouped.genera.length + grouped.species.length
                )}
              </>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
