'use client';

import { useState } from 'react';

interface DisclosureProps {
  title: string | React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function Disclosure({ title, defaultOpen = false, badge, children }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="text-[1.1rem] font-medium text-text-primary">{title}</span>
          {badge}
        </span>
        <svg
          className="disclosure-chevron h-4 w-4 text-text-tertiary"
          data-open={isOpen}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="disclosure-content" data-open={isOpen}>
        <div>
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
