import AdminFilterSkeleton from '@/app/components/AdminFilterSkeleton'

// โครงตรงกับ app/admin/reviews/page.tsx: หัวข้อ → ตัวกรอง → การ์ดรีวิว
export default function Loading() {
  return (
    <div>
      <div className="h-9 w-44 rounded bg-surface animate-pulse mb-6" />

      {/* ของจริง: ช่องค้นหา + กรองคะแนน (w-44) + กรองผู้รีวิว (w-40) */}
      <AdminFilterSkeleton selectWidths={['w-44', 'w-40']} />

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 70}ms` }}
            className="rounded-lg bg-surface border border-line p-4 flex items-start justify-between gap-4 animate-pulse"
          >
            <div className="min-w-0 flex-1 space-y-2">
              {/* บรรทัดบนของจริง: ดาว + @ผู้เขียน + วันที่ อยู่บรรทัดเดียวกัน */}
              <div className="h-3.5 w-56 rounded bg-surface2" />
              {/* ชื่อ prompt */}
              <div className="h-3 w-40 rounded bg-surface2" />
              {/* ข้อความรีวิว */}
              <div className="h-4 w-3/4 rounded bg-surface2" />
            </div>
            <div className="h-8 w-16 shrink-0 rounded bg-surface2" />
          </div>
        ))}
      </div>
    </div>
  )
}
