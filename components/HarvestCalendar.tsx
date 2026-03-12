interface HarvestCalendarProps {
  /** e.g. 'mid', 'early', 'late', 'extended' */
  harvestSeason: string | null;
  /** Optional bloom period text for bloom highlighting */
  bloomPeriod?: string | null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Infer harvest month range from the harvest_season enum.
 * This is species-dependent \u2014 we use sensible defaults here and
 * can refine later with actual month data from cultivar_traits.harvest_window.
 */
function getHarvestMonths(season: string | null): [number, number] | null {
  if (!season) return null;
  switch (season) {
    case 'early': return [6, 7];     // Jul\u2013Aug
    case 'mid': return [7, 8];       // Aug\u2013Sep
    case 'late': return [8, 9];      // Sep\u2013Oct
    case 'extended': return [6, 9];  // Jul\u2013Oct
    default: return null;
  }
}

/**
 * Infer approximate bloom months. For most temperate nut/fruit trees
 * bloom is winter to spring. Refine with real data later.
 */
function getBloomMonths(bloomPeriod: string | null | undefined): [number, number] | null {
  if (!bloomPeriod) return null;
  switch (bloomPeriod) {
    case 'very_early': return [0, 1]; // Jan\u2013Feb
    case 'early': return [0, 2];      // Jan\u2013Mar
    case 'mid': return [1, 3];        // Feb\u2013Apr
    case 'late': return [2, 4];       // Mar\u2013May
    case 'very_late': return [3, 4];  // Apr\u2013May
    default: return null;
  }
}

export function HarvestCalendar({ harvestSeason, bloomPeriod }: HarvestCalendarProps) {
  const harvestRange = getHarvestMonths(harvestSeason);
  const bloomRange = getBloomMonths(bloomPeriod);

  if (!harvestRange && !bloomRange) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
      <div className="flex items-center gap-[3px] min-w-[370px]">
        {MONTHS.map((m, i) => {
          const isHarvest = harvestRange ? i >= harvestRange[0] && i <= harvestRange[1] : false;
          const isBloom = bloomRange ? i >= bloomRange[0] && i <= bloomRange[1] : false;

          let bgColor = 'var(--color-surface-inset)';
          let textColor = 'var(--color-text-tertiary)';
          let border = '1px solid var(--color-border-subtle)';

          if (isHarvest) {
            bgColor = '#e67e22';
            textColor = '#ffffff';
            border = '1px solid #d35400';
          } else if (isBloom) {
            bgColor = '#f1c40f';
            textColor = '#6b5b00';
            border = '1px solid #d4ac0d';
          }

          return (
            <div key={m} className="flex flex-col items-center gap-1">
              <div
                className="flex items-center justify-center rounded-md text-[10px] font-semibold transition-colors"
                style={{
                  width: 30,
                  height: 28,
                  backgroundColor: bgColor,
                  color: textColor,
                  border,
                }}
              >
                {m.substring(0, 1)}
              </div>
              <span className="text-[8px] text-text-tertiary">{m}</span>
            </div>
          );
        })}
      </div>
      </div>
      <div className="flex gap-4 text-xs text-text-secondary">
        {bloomRange && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#f1c40f' }} />
            Bloom
          </span>
        )}
        {harvestRange && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#e67e22' }} />
            Harvest
          </span>
        )}
      </div>
    </div>
  );
}
