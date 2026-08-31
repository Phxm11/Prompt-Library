import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/app/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    // จอเล็กกว่า lg: ซ้อนกันเป็นคอลัมน์ (แถบเมนูอยู่บน เนื้อหาอยู่ล่าง) แทนการเรียงข้างกันที่ดันเนื้อหาแคบเกินไป
    <div className="min-h-screen bg-base flex flex-col lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-6xl">{children}</main>
    </div>
  )
}
