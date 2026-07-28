export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-pulse">
      {/* หัวข้อ text-4xl สูงราว 40px — ต้องตรงกับของจริงไม่งั้นฟอร์มกระโดดตอนสลับ */}
      <div className="h-10 w-56 rounded bg-surface mb-8" />

      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 rounded bg-surface mb-2" />
            <div className="h-11 rounded-lg bg-surface border border-line" />
          </div>
        ))}
        <div className="h-12 rounded-lg bg-surface border border-line" />
      </div>
    </div>
  )
}