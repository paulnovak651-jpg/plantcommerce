'use client';

import { SearchBar } from '@/components/ui/SearchBar';

export function HeaderSearch() {
  return (
    <SearchBar
      className="w-full [&_input]:py-2 [&_input]:text-sm [&_input]:shadow-none [&_input]:bg-surface-primary [&_input]:border [&_input]:border-border [&_input]:rounded-full"
      inputId="header-search"
      placeholders={['Search plants...']}
    />
  );
}
