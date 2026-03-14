'use client';

import { useState } from 'react';

export type TabId = 'glance' | 'growing' | 'harvest' | 'buy';

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

interface CultivarTabsProps {
  tabs: Tab[];
  children: Record<TabId, React.ReactNode>;
}

/**
 * Client-side tab switcher for the cultivar detail page.
 * Tabs render as a horizontal bar that sticks below the hero header.
 * All tab content is passed in as a record so no lazy-loading is needed \u2014
 * the server already rendered everything.
 */
export function CultivarTabs({ tabs, children }: CultivarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'glance');

  return (
    <>
      {/* Tab bar */}
      <div className="overflow-x-auto border-b border-border-subtle mb-6 -mx-4 px-4">
        <nav className="flex gap-0 -mb-px flex-nowrap whitespace-nowrap" aria-label="Cultivar detail tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border'
                  }
                `}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-accent' : 'text-text-tertiary'}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          className={activeTab === tab.id ? 'block' : 'hidden'}
          aria-hidden={activeTab !== tab.id}
        >
          {children[tab.id]}
        </div>
      ))}
    </>
  );
}
