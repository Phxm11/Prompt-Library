export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* ต้องสูง/กว้างใกล้เคียงหัวข้อจริง ไม่งั้นตอนสลับจากโครงเป็นเนื้อหาหน้าจะกระตุก */}
      <div className="h-10 w-44 rounded bg-surface animate-pulse mb-3" />
      <div className="h-4 w-80 max-w-full rounded bg-surface animate-pulse mb-8" />

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-line animate-pulse"
          >
            <div className="w-9 h-9 rounded-lg bg-surface2 shrink-0" />
            <div className="w-16 h-16 rounded-lg bg-surface2 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded-full bg-surface2" />
              <div className="h-4 w-48 rounded bg-surface2" />
            </div>
            <div className="w-10 h-8 rounded bg-surface2 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}