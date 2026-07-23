export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-pulse">
      <div className="h-3 w-28 rounded bg-[#12121c] mb-3" />
      <div className="h-9 w-48 rounded bg-[#12121c] mb-8" />

      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 rounded bg-[#12121c] mb-2" />
            <div className="h-11 rounded-lg bg-[#12121c] border border-[#232336]" />
          </div>
        ))}
        <div className="h-12 rounded-lg bg-[#12121c] border border-[#232336]" />
      </div>
    </div>
  )
}