export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="h-10 w-64 rounded bg-surface animate-pulse mb-3" />
      <div className="h-4 w-32 rounded bg-surface animate-pulse mb-8" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface border border-line animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-surface2" />
              <div className="h-3 w-24 rounded bg-surface2" />
            </div>
            <div className="h-3 w-28 rounded bg-surface2" />
          </div>
        ))}
      </div>
    </div>
  )
}