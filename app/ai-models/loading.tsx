// โครงต้องตรงกับ app/ai-models/page.tsx: กล่องมีโลโก้ซ้าย ชื่อ+ผู้ให้บริการขวา
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="h-10 w-40 rounded bg-surface animate-pulse mb-3" />
      <div className="h-4 w-64 max-w-full rounded bg-surface animate-pulse mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-surface border border-line animate-pulse flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-surface2 shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-surface2" />
              <div className="h-3 w-20 rounded bg-surface2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
