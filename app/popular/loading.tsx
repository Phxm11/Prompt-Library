export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="h-3 w-32 rounded bg-[#12121c] animate-pulse mb-3" />
      <div className="h-9 w-40 rounded bg-[#12121c] animate-pulse mb-2" />
      <div className="h-4 w-80 rounded bg-[#12121c] animate-pulse mb-8" />

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-[#12121c] border border-[#232336] animate-pulse"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1a1a28] shrink-0" />
            <div className="w-16 h-16 rounded-lg bg-[#1a1a28] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded-full bg-[#1a1a28]" />
              <div className="h-4 w-48 rounded bg-[#1a1a28]" />
            </div>
            <div className="w-10 h-8 rounded bg-[#1a1a28] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}