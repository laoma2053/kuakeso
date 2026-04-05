export default function SearchLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 sm:gap-6">
          <div className="h-7 sm:h-9 w-24 bg-surface-secondary rounded animate-pulse flex-shrink-0" />
          <div className="flex-1 max-w-2xl h-10 sm:h-12 bg-surface-secondary rounded-full animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <div className="h-4 w-48 bg-surface-secondary rounded animate-pulse mb-3" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-white">
                <div className="h-5 w-3/4 bg-surface-secondary rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-surface-secondary rounded animate-pulse mb-3" />
                <div className="h-4 w-1/4 bg-surface-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block w-64 space-y-3">
            <div className="h-32 bg-surface-secondary rounded-lg animate-pulse" />
            <div className="h-32 bg-surface-secondary rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
