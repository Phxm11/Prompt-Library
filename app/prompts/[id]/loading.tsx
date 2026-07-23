export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-pulse">
      <div className="h-4 w-28 rounded bg-[#12121c] mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
        {/* ซ้าย: gallery skeleton */}
        <div className="lg:col-span-3">
          <div className="aspect-video rounded-xl bg-[#12121c] border border-[#232336] mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-20 rounded-lg bg-[#12121c] border border-[#232336]" />
            ))}
          </div>
        </div>

        {/* ขวา: รายละเอียด skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-[#12121c]" />
            <div className="h-6 w-16 rounded-full bg-[#12121c]" />
          </div>
          <div className="h-7 w-4/5 rounded bg-[#12121c]" />
          <div className="h-4 w-24 rounded bg-[#12121c]" />
          <div className="h-32 rounded-lg bg-[#12121c] border border-[#232336]" />
          <div className="h-11 rounded-lg bg-[#12121c] border border-[#232336]" />
        </div>
      </div>
    </div>
  )
}