interface NutProfileProps {
  weightGrams: number | null;
  kernelPct: number | null;
  flavorNotes: string | null;
  storageQuality: string | null;
}

export function NutProfile({ weightGrams, kernelPct, flavorNotes, storageQuality }: NutProfileProps) {
  const hasData = weightGrams != null || kernelPct != null || flavorNotes || storageQuality;

  if (!hasData) return null;

  return (
    <div className="space-y-4">
      {/* Weight and kernel percentage */}
      <div className="grid gap-4 sm:grid-cols-2">
        {weightGrams != null && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Weight</p>
            <p className="font-serif text-2xl font-bold text-text-primary">{weightGrams}g</p>
          </div>
        )}
        {kernelPct != null && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Kernel Percentage</p>
            <p className="font-serif text-2xl font-bold text-text-primary mb-1">{kernelPct}%</p>
            <div className="h-3 w-full rounded-full bg-surface-inset overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(kernelPct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Flavor and storage */}
      {(flavorNotes || storageQuality) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {flavorNotes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Flavor Notes</p>
              <p className="text-sm text-text-secondary">{flavorNotes}</p>
            </div>
          )}
          {storageQuality && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">Storage Quality</p>
              <p className="text-sm text-text-secondary capitalize">{storageQuality.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
