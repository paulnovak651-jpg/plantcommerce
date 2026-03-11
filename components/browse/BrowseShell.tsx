'use client';

import type { ReactNode } from 'react';

interface BrowseShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * Structural layout wrapper for browse page:
 * sidebar (280px) + content column on desktop, stacked on mobile.
 */
export function BrowseShell({ sidebar, children }: BrowseShellProps) {
  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      {sidebar}
      <div>{children}</div>
    </div>
  );
}
