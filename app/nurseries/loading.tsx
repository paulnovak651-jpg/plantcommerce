export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-40 rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 h-5 w-40 rounded bg-gray-200" />
            <div className="mb-1 h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
