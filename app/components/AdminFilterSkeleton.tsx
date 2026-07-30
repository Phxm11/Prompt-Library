/**
 * โครงแถบตัวกรองของหน้า admin (ช่องค้นหา + ช่องเลือก + จำนวนที่พบ)
 *
 * ความสูง 38px มาจากของจริง: py-2 (16) + text-sm (20) + เส้นขอบ (2)
 * ส่วนความกว้างรับเข้ามาเพราะแต่ละหน้าใช้ไม่เท่ากัน
 */
export default function AdminFilterSkeleton({
  selectWidths,
}: {
  /** คลาสความกว้างของช่องเลือกแต่ละอัน เรียงซ้ายไปขวา เช่น ['w-44', 'w-40'] */
  selectWidths: string[]
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <div className="h-[38px] w-60 rounded-lg bg-surface border border-line animate-pulse" />
      {selectWidths.map((w, i) => (
        <div
          key={i}
          className={`h-[38px] ${w} rounded-lg bg-surface border border-line animate-pulse`}
        />
      ))}
      <div className="h-3 w-24 rounded bg-surface animate-pulse" />
    </div>
  )
}
