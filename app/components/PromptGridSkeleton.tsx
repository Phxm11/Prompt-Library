export default function PromptGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-[#12121c] border border-[#232336] animate-pulse"
        >
          <div className="aspect-video bg-[#1a1a28]" />
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-[#1a1a28]" />
              <div className="h-5 w-14 rounded-full bg-[#1a1a28]" />
            </div>
            <div className="h-4 w-4/5 rounded bg-[#1a1a28]" />
            <div className="h-3 w-full rounded bg-[#1a1a28]" />
            <div className="h-3 w-3/5 rounded bg-[#1a1a28]" />
            <div className="flex gap-3 pt-2">
              <div className="h-3 w-8 rounded bg-[#1a1a28]" />
              <div className="h-3 w-8 rounded bg-[#1a1a28]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}