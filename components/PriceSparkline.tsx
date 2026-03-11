'use client';

interface PricePoint {
  date: string;
  priceCents: number;
}

interface PriceSparklineProps {
  /** Points sorted by date ascending */
  points: PricePoint[];
  width?: number;
  height?: number;
  nurseryName?: string;
}

export function PriceSparkline({
  points,
  width = 200,
  height = 48,
  nurseryName,
}: PriceSparklineProps) {
  if (points.length < 3) return null;

  const prices = points.map((p) => p.priceCents);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const padX = 4;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pathPoints = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * innerW;
    const y = padY + innerH - ((p.priceCents - minPrice) / priceRange) * innerH;
    return { x, y, ...p };
  });

  const d = pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const current = points[points.length - 1];
  const previous = points[points.length - 2];
  const trending = current.priceCents <= previous.priceCents ? 'down' : 'up';
  const strokeColor =
    trending === 'down' ? 'var(--color-status-active)' : 'var(--color-status-unavailable, #ef4444)';

  return (
    <div className="group relative inline-block">
      {nurseryName && (
        <span className="mr-2 text-xs text-text-tertiary">{nurseryName}</span>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="inline-block align-middle"
        role="img"
        aria-label={`Price trend for ${nurseryName ?? 'offer'}: ${trending === 'down' ? 'decreasing' : 'increasing'}`}
      >
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pathPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={2.5} fill={strokeColor} opacity={0.7} />
            <title>
              {new Date(p.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {' — '}${(p.priceCents / 100).toFixed(2)}
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}
