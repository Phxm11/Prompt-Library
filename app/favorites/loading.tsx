import PromptGridSkeleton from '@/app/components/PromptGridSkeleton'

// โครงต้องตรงกับ app/favorites/page.tsx: max-w-6xl + หัวข้อ + คำอธิบาย + กริดการ์ด 3 คอลัมน์
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="h-10 w-52 rounded bg-surface animate-pulse mb-3" />
      <div className="h-4 w-44 rounded bg-surface animate-pulse mb-8" />

      <PromptGridSkeleton count={6} />
    </div>
  )
}
