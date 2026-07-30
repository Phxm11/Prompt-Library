export type SkeletonColumn = {
  /** คลาสความกว้าง ใช้สัดส่วนเดียวกับคอลัมน์จริง เช่น 'flex-[2]' */
  width: string
  /** ใส่ 2 เมื่อคอลัมน์จริงมีข้อความสองบรรทัด (เช่น ชื่อเล่น + @username) */
  lines?: 1 | 2
}

/**
 * โครงตารางของหน้า admin
 *
 * จุดสำคัญคือความสูงแถวและสัดส่วนคอลัมน์ต้องเท่าของจริง
 * ไม่งั้นพอโหลดเสร็จเนื้อหาจะกระโดด ซึ่งน่ารำคาญกว่าไม่มี skeleton เสียอีก
 */
export default function AdminTableSkeleton({
  columns,
  rows = 8,
}: {
  columns: SkeletonColumn[]
  rows?: number
}) {
  return (
    <div className="rounded-xl bg-surface border border-line overflow-hidden">
      {/* หัวตาราง: ของจริงเป็น text-xs ใน px-4 py-3 */}
      <div className="flex gap-4 border-b border-line px-4 py-3">
        {columns.map((col, i) => (
          <div key={i} className={`${col.width} h-3 rounded bg-surface2 animate-pulse`} />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-start gap-4 border-b border-line px-4 py-3 last:border-0">
          {columns.map((col, c) => (
            <div key={c} className={`${col.width} space-y-1.5`}>
              <div
                className="h-4 rounded bg-surface2 animate-pulse"
                // ไล่จังหวะกะพริบทีละแถว ดูมีชีวิตกว่ากะพริบพร้อมกันทั้งตาราง
                style={{ animationDelay: `${r * 70}ms` }}
              />
              {col.lines === 2 && (
                <div
                  className="h-3 w-2/3 rounded bg-surface2 animate-pulse"
                  style={{ animationDelay: `${r * 70}ms` }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
