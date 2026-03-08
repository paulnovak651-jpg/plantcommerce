export function PlantCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] bg-surface-raised overflow-hidden">
      <div className="aspect-[3/4] animate-pulse bg-surface-inset" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-inset" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-inset" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-inset" />
      </div>
    </div>
  );
}

export function BrowseGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <PlantCardSkeleton key={i} />
      ))}
    </div>
  );
}
