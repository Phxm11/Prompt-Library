import PromptGridSkeleton from '@/app/components/PromptGridSkeleton'

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="h-3 w-32 rounded bg-[#12121c] animate-pulse mb-3" />
      <div className="h-9 w-56 rounded bg-[#12121c] animate-pulse mb-2" />
      <div className="h-4 w-80 rounded bg-[#12121c] animate-pulse mb-8" />

      <div className="flex gap-2.5 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-[#12121c] animate-pulse" />
        ))}
      </div>

      <PromptGridSkeleton />
    </div>
  )
}