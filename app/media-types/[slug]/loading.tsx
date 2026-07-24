import PromptGridSkeleton from '@/app/components/PromptGridSkeleton'

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <PromptGridSkeleton />
    </div>
  )
}