'use client';

import { useState, type ReactNode } from 'react';

interface BrowseShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * Structural layout wrapper for browse page:
 * sidebar (280px) + content column on desktop, stacked on mobile.
 */
export function BrowseShell({ sidebar, children }: BrowseShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      {/* Mobile filter toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mb-4 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-secondary lg:hidden cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {sidebarOpen ? 'Hide Filters' : 'Filters & Categories'}
      </button>

      {/* Sidebar: always visible on lg+, toggle on mobile */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
        {sidebar}
      </div>

      <div>{children}</div>
    </div>
  );
}
