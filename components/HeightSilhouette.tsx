interface HeightSilhouetteProps {
  minFt: number | null;
  maxFt: number | null;
}

/**
 * Visual height comparison: a 6-ft person silhouette next to min/max tree shapes.
 * SVG-based, no external images required.
 */
export function HeightSilhouette({ minFt, maxFt }: HeightSilhouetteProps) {
  if (minFt == null && maxFt == null) return null;

  const effectiveMin = minFt ?? maxFt!;
  const effectiveMax = maxFt ?? minFt!;

  // Scale: 6ft person = 40px
  const personH = 40;
  const scale = personH / 6;
  const treeMinH = Math.max(effectiveMin * scale, 20);
  const treeMaxH = Math.max(effectiveMax * scale, 24);

  return (
    <div className="flex items-end gap-4 py-2">
      {/* Person */}
      <div className="flex flex-col items-center">
        <svg width="20" height={personH + 4} viewBox={`0 0 20 ${personH + 4}`} aria-label="6 foot person for scale">
          <circle cx="10" cy="4" r="4" fill="var(--color-text-tertiary)" opacity="0.4" />
          <rect x="6" y="9" width="8" height={personH - 12} rx="3" fill="var(--color-text-tertiary)" opacity="0.4" />
          <rect x="4" y={personH - 6} width="5" height="10" rx="2" fill="var(--color-text-tertiary)" opacity="0.4" />
          <rect x="11" y={personH - 6} width="5" height="10" rx="2" fill="var(--color-text-tertiary)" opacity="0.4" />
        </svg>
        <span className="text-[10px] text-text-tertiary mt-0.5">6 ft</span>
      </div>

      {/* Tree min */}
      <div className="flex flex-col items-center">
        <svg width="30" height={treeMinH + 10} viewBox={`0 0 30 ${treeMinH + 10}`} aria-label={`Minimum height ${effectiveMin} feet`}>
          <ellipse cx="15" cy={treeMinH * 0.35} rx="13" ry={treeMinH * 0.38} fill="var(--color-accent)" opacity="0.35" />
          <rect x="13" y={treeMinH * 0.55} width="4" height={treeMinH * 0.45 + 4} rx="2" fill="var(--color-text-tertiary)" opacity="0.5" />
        </svg>
        <span className="text-[10px] text-accent font-semibold mt-0.5">{effectiveMin} ft</span>
      </div>

      {/* Tree max (only show if different from min) */}
      {effectiveMax !== effectiveMin && (
        <div className="flex flex-col items-center">
          <svg width="40" height={treeMaxH + 10} viewBox={`0 0 40 ${treeMaxH + 10}`} aria-label={`Maximum height ${effectiveMax} feet`}>
            <ellipse cx="20" cy={treeMaxH * 0.35} rx="18" ry={treeMaxH * 0.40} fill="var(--color-accent-hover)" opacity="0.4" />
            <rect x="18" y={treeMaxH * 0.55} width="4" height={treeMaxH * 0.45 + 4} rx="2" fill="var(--color-text-tertiary)" opacity="0.5" />
          </svg>
          <span className="text-[10px] text-accent font-semibold mt-0.5">{effectiveMax} ft</span>
        </div>
      )}
    </div>
  );
}
