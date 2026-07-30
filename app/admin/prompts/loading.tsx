import AdminTableSkeleton from '@/app/components/AdminTableSkeleton'
import AdminFilterSkeleton from '@/app/components/AdminFilterSkeleton'

// โครงตรงกับ app/admin/prompts/page.tsx: หัวข้อ → ตัวกรอง → ตาราง 6 คอลัมน์
export default function Loading() {
  return (
    <div>
      <div className="h-9 w-52 rounded bg-surface animate-pulse mb-6" />

      {/* ของจริง: ช่องค้นหา + กรองหมวดหมู่ (w-52) + กรองสถานะ (w-44) */}
      <AdminFilterSkeleton selectWidths={['w-52', 'w-44']} />

      <AdminTableSkeleton
        columns={[
          { width: 'flex-[2]' }, // ชื่อ
          { width: 'flex-1' }, // หมวดหมู่
          { width: 'flex-1' }, // สถานะ
          { width: 'flex-1' }, // 👁 / 📋
          { width: 'flex-1' }, // วันที่สร้าง
          { width: 'flex-1' }, // จัดการ
        ]}
      />
    </div>
  )
}
