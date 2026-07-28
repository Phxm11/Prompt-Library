// โครงตรงกับ app/admin/page.tsx: หัวข้อ + การ์ดตัวเลข 10 ใบ + การ์ดกราฟแท่ง
export default function Loading() {
  return (
    <div>
      <div className="h-9 w-56 rounded bg-surface animate-pulse mb-8" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface border border-line p-5 animate-pulse">
            <div className="h-3 w-24 rounded bg-surface2 mb-3" />
            <div className="h-7 w-16 rounded bg-surface2" />
          </div>
        ))}
      </div>

      <div className="h-3 w-40 rounded bg-surface animate-pulse mb-3" />
      <div className="rounded-xl bg-surface border border-line p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-4 w-32 shrink-0 rounded bg-surface2" />
            <div className="h-2 flex-1 rounded-full bg-surface2" />
            <div className="h-3 w-8 rounded bg-surface2" />
          </div>
        ))}
      </div>
    </div>
  )
}
