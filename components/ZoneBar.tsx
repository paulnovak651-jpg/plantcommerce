'use client';

import { getUserZone } from '@/lib/zone-persistence';
import { useEffect, useState } from 'react';

interface ZoneBarProps {
  min: number;
  max: number;
}

const ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * Visual zone bar: 13 columns, active range highlighted with a green gradient.
 * If the user has a stored zone, it shows a marker dot on their zone.
 */
export function ZoneBar({ min, max }: ZoneBarProps) {
  const [userZone, setUserZone] = useState<number | null>(null);

  useEffect(() => {
    setUserZone(getUserZone());
    function sync() {
      setUserZone(getUserZone());
    }
    window.addEventListener('zone-changed', sync);
    return () => window.removeEventListener('zone-changed', sync);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
      <div className="flex items-end gap-[3px] min-w-[290px]">
        {ZONES.map((z) => {
          const inRange = z >= min && z <= max;
          const isUserZone = userZone === z;
          // Bar height scales slightly with zone number for visual interest
          const heightPx = 10 + z * 1.5;

          return (
            <div key={z} className="flex flex-col items-center gap-1">
              <div className="relative">
                <div
                  className="rounded transition-all duration-200"
                  style={{
                    width: 22,
                    height: heightPx,
                    backgroundColor: inRange
                      ? `hsl(${150 - (z - min) * 8}, 50%, ${42 + (z - min) * 3}%)`
                      : 'var(--color-surface-inset)',
                    border: inRange
                      ? '1px solid rgba(0,0,0,0.06)'
                      : '1px solid transparent',
                  }}
                />
                {isUserZone && (
                  <span
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full border-2 border-surface-raised"
                    style={{
                      backgroundColor: inRange
                        ? 'var(--color-accent)'
                        : 'var(--color-status-error)',
                    }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: inRange
                    ? 'var(--color-accent-hover)'
                    : 'var(--color-text-tertiary)',
                  fontWeight: inRange ? 600 : 400,
                }}
              >
                {z}
              </span>
            </div>
          );
        })}
      </div>
      </div>
      {userZone !== null && (
        <span className="text-xs text-text-tertiary">
          {userZone >= min && userZone <= max ? (
            <span className="text-accent font-medium">
              \u2713 Your zone ({userZone}) is compatible
            </span>
          ) : (
            <span className="text-status-error">
              Zone {userZone} is outside the {min}\u2013{max} range
            </span>
          )}
        </span>
      )}
    </div>
  );
}
