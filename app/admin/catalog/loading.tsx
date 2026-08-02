export default function Loading() {
  return (
    <div>
      <div className="h-9 w-72 rounded bg-surface animate-pulse mb-2" />
      <div className="h-4 w-96 rounded bg-surface animate-pulse mb-8" />

      <div className="flex gap-4 border-b border-line mb-6 pb-2.5">
        {['w-20', 'w-24', 'w-24', 'w-16'].map((w, i) => (
          <div key={i} className={`h-4 ${w} rounded bg-surface animate-pulse`} />
        ))}
      </div>

      <div className="h-40 rounded-xl bg-surface border border-line animate-pulse mb-6" />

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 70}ms` }}
            className="h-14 rounded-lg bg-surface border border-line animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
