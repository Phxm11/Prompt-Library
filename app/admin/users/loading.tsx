import AdminTableSkeleton from '@/app/components/AdminTableSkeleton'
import AdminFilterSkeleton from '@/app/components/AdminFilterSkeleton'

// โครงตรงกับ app/admin/users/page.tsx: หัวข้อ → ตัวกรอง → ตาราง 4 คอลัมน์
export default function Loading() {
  return (
    <div>
      <div className="h-9 w-48 rounded bg-surface animate-pulse mb-6" />

      {/* ของจริง: ช่องค้นหา + กรองสิทธิ์ (w-44) + กรองสถานะ (w-40) */}
      <AdminFilterSkeleton selectWidths={['w-44', 'w-40']} />

      <AdminTableSkeleton
        columns={[
          { width: 'flex-[2]', lines: 2 }, // ผู้ใช้ — ชื่อเล่นบรรทัดบน @username บรรทัดล่าง
          { width: 'flex-1' }, // สถานะ
          { width: 'flex-1' }, // สมัครเมื่อ
          { width: 'flex-[2]' }, // จัดการ
        ]}
      />
    </div>
  )
}
