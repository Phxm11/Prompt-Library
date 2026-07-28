/**
 * โครงตารางของหน้า admin ใช้ร่วมกันระหว่างหน้าจัดการ Prompt กับจัดการผู้ใช้
 * รับจำนวนคอลัมน์เข้ามาเพื่อให้ความกว้างของหัวตารางตรงกับของจริง
 */
export default function AdminTableSkeleton({
  columns,
  rows = 8,
}: {
  columns: number
  rows?: number
}) {
  return (
    <div className="rounded-xl bg-surface border border-line overflow-hidden">
      <div className="flex gap-4 border-b border-line px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-surface2 animate-pulse" />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-4 flex-1 rounded bg-surface2 animate-pulse"
              // ไล่จังหวะกะพริบทีละแถว ดูมีชีวิตกว่ากะพริบพร้อมกันทั้งตาราง
              style={{ animationDelay: `${r * 70}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
