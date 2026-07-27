// โครงต้องตรงกับ app/media-types/page.tsx: max-w-6xl + หัวข้อ + คำอธิบาย + กริดกล่อง 3 คอลัมน์
export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="h-10 w-48 rounded bg-surface animate-pulse mb-3" />
      <div className="h-4 w-72 max-w-full rounded bg-surface animate-pulse mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-surface border border-line animate-pulse flex items-center gap-3.5"
          >
            {/* ช่องไอคอน 44px ต้องมีในโครงด้วย ไม่งั้นตอนสลับเป็นของจริงข้อความจะกระโดดไปทางขวา */}
            <div className="h-11 w-11 rounded-lg bg-surface2 shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-28 rounded bg-surface2" />
              <div className="h-4 w-20 rounded bg-surface2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
