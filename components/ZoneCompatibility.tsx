'use client';

import { useState, useEffect } from 'react';
import { getUserZone } from '@/lib/zone-persistence';

interface ZoneCompatibilityProps {
  zoneMin: number | null;
  zoneMax: number | null;
}

/**
 * Shows whether a plant is compatible with the user's stored USDA zone.
 * Renders nothing if no zone is stored or no zone data is available.
 */
export function ZoneCompatibility({ zoneMin, zoneMax }: ZoneCompatibilityProps) {
  const [userZone, setUserZone] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserZone(getUserZone());
  }, []);

  useEffect(() => {
    function sync() {
      setUserZone(getUserZone());
    }
    window.addEventListener('zone-changed', sync);
    return () => window.removeEventListener('zone-changed', sync);
  }, []);

  if (!mounted || userZone === null || zoneMin === null || zoneMax === null) {
    return null;
  }

  const compatible = userZone >= zoneMin && userZone <= zoneMax;

  if (compatible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Grows in your zone (Zone {userZone})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-inset px-3 py-1 text-sm text-text-secondary">
      <svg className="h-4 w-4 text-status-unavailable" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
      Outside your zone (Zone {userZone}) — needs Zone {zoneMin}&ndash;{zoneMax}
    </span>
  );
}
