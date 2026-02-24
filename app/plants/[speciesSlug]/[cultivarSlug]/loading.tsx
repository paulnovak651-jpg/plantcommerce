export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-4 w-64 rounded bg-gray-200" />
      <div className="mb-2 h-8 w-48 rounded bg-gray-200" />
      <div className="mb-8 h-4 w-40 rounded bg-gray-200" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-gray-50 p-3">
            <div className="mb-1 h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mb-8">
        <div className="mb-2 h-6 w-32 rounded bg-gray-200" />
        <div className="h-16 rounded bg-gray-100" />
      </div>
    </div>
  );
}
