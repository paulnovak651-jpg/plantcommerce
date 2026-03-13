interface ResistanceMeterProps {
  diseases: Record<string, 'immune' | 'resistant' | 'moderate' | 'susceptible' | 'unknown'>;
}

const LEVEL_CONFIG = {
  immune: { segments: 4, color: '#27ae60', label: 'Immune' },
  resistant: { segments: 3, color: '#7daa5c', label: 'Resistant' },
  moderate: { segments: 2, color: '#f39c12', label: 'Moderate' },
  susceptible: { segments: 1, color: '#e74c3c', label: 'Susceptible' },
  unknown: { segments: 0, color: '#d1d5db', label: 'Unknown' },
} as const;

export function ResistanceMeter({ diseases }: ResistanceMeterProps) {
  const entries = Object.entries(diseases).filter(([, level]) => level !== 'unknown');

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map(([disease, level]) => {
        const config = LEVEL_CONFIG[level];
        return (
          <div key={disease}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-text-primary capitalize">
                {disease.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-text-tertiary">{config.label}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((seg) => (
                <div
                  key={seg}
                  className="h-2 flex-1 rounded-sm"
                  style={{
                    backgroundColor: seg <= config.segments ? config.color : '#e5e7eb',
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
