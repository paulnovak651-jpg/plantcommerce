import { Text } from './Text';

interface RangeBarProps {
  label: string;
  scaleMin: number;
  scaleMax: number;
  valueMin: number;
  valueMax: number;
  unit?: string;
  note?: string;
  color?: 'green' | 'blue' | 'amber';
  compact?: boolean;
}

const fillColorClass: Record<NonNullable<RangeBarProps['color']>, string> = {
  green: 'bg-accent',
  blue: 'bg-info',
  amber: 'bg-community',
};

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, '');
}

export function RangeBar({
  label,
  scaleMin,
  scaleMax,
  valueMin,
  valueMax,
  unit = '',
  note,
  color = 'green',
  compact = false,
}: RangeBarProps) {
  const safeMin = Math.min(valueMin, valueMax);
  const safeMax = Math.max(valueMin, valueMax);
  const denom = Math.max(scaleMax - scaleMin, 1);

  const normalizedStart = ((clamp(safeMin, scaleMin, scaleMax) - scaleMin) / denom) * 100;
  const normalizedEnd = ((clamp(safeMax, scaleMin, scaleMax) - scaleMin) / denom) * 100;
  const normalizedWidth = Math.max(normalizedEnd - normalizedStart, 0);
  const isPoint = normalizedWidth === 0;

  const rangeLabel = `${formatNumber(safeMin)}-${formatNumber(safeMax)}${unit}`;
  const minLabel = `${formatNumber(scaleMin)}${unit}`;
  const maxLabel = `${formatNumber(scaleMax)}${unit}`;
  const heightClass = compact ? 'min-h-[36px]' : 'min-h-[48px]';
  const compactText = compact ? (
    <Text variant="caption" color="secondary">
      {rangeLabel}
    </Text>
  ) : null;

  return (
    <div className={heightClass}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <Text variant="caption" color="tertiary">
          {label}
        </Text>
        {!compact && (
          <Text variant="body" className="whitespace-nowrap">
            {rangeLabel}
          </Text>
        )}
      </div>

      <div className="relative">
        <div className="h-2 w-full rounded-full bg-surface-inset" />
        {isPoint ? (
          <span
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${fillColorClass[color]}`}
            style={{ left: `${normalizedStart}%` }}
            aria-hidden="true"
          />
        ) : (
          <span
            className={`absolute top-0 h-2 rounded-full ${fillColorClass[color]}`}
            style={{ left: `${normalizedStart}%`, width: `${normalizedWidth}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <Text variant="caption" color="tertiary">
          {minLabel}
        </Text>
        {compactText}
        <Text variant="caption" color="tertiary">
          {maxLabel}
        </Text>
      </div>

      {note && (
        <Text variant="caption" color="tertiary" className="mt-1 block">
          {note}
        </Text>
      )}
    </div>
  );
}

