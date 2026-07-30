import { createClient } from '@/lib/supabase/server'
import AdminPromptActions from '@/app/admin/prompts/AdminPromptActions'
import AdminPromptFilters from '@/app/admin/prompts/AdminPromptFilters'

export default async function AdminPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { category, status, q } = await searchParams

  let query = supabase
    .from('prompts')
    .select('prompt_id, title, is_public, status, view_count, copy_count, created_at, categories(name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .limit(100)

  if (category) query = query.eq('category_id', category)
  if (status) query = query.eq('status', status)
  /*
    ค้นจากชื่อ prompt แบบไม่สนตัวพิมพ์เล็กใหญ่
    ต้อง escape % กับ _ ก่อน เพราะเป็นอักขระพิเศษของ LIKE
    ถ้าไม่ escape พิมพ์ % ตัวเดียวจะกลายเป็น "ตรงกับทุกอย่าง"
  */
  if (q) {
    const keyword = q.replace(/[%_\\]/g, (ch) => `\\${ch}`)
    query = query.ilike('title', `%${keyword}%`)
  }

  const [{ data: prompts, error, count }, { data: categories }] = await Promise.all([
    query,
    supabase
      .from('categories')
      .select('category_id, name')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return (
    <div>
      <h1 className="animate-spring-up section-title text-3xl font-extrabold text-ink mb-6">
        จัดการ Prompt ทั้งหมด
      </h1>

      {error && <p className="text-accent2">เกิดข้อผิดพลาด: {error.message}</p>}

      <div className="animate-spring-up [animation-delay:60ms] relative z-20">
        <AdminPromptFilters
          categories={(categories ?? []).map((c) => ({ id: c.category_id, name: c.name }))}
          total={count ?? prompts?.length ?? 0}
        />
      </div>

      <div className="animate-spring-up [animation-delay:120ms] rounded-xl bg-surface border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-faint font-mono text-xs">
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">หมวดหมู่</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">👁 / 📋</th>
              <th className="px-4 py-3">วันที่สร้าง</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {prompts?.map((p: any) => (
              <tr key={p.prompt_id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink max-w-xs truncate">{p.title}</td>
                <td className="px-4 py-3 text-muted font-mono text-xs">
                  {p.categories?.name ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      p.status === 'draft'
                        ? 'bg-accent2/10 text-accent2'
                        : p.is_public
                        ? 'bg-accent/10 text-accent'
                        : 'bg-line text-muted'
                    }`}
                  >
                    {p.status === 'draft' ? 'ฉบับร่าง' : p.is_public ? 'สาธารณะ' : 'ส่วนตัว'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted font-mono text-xs">
                  {p.view_count} / {p.copy_count}
                </td>
                <td className="px-4 py-3 text-faint font-mono text-xs">
                  {new Date(p.created_at).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">
                  <AdminPromptActions promptId={p.prompt_id} title={p.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {prompts?.length === 0 && (
          <p className="text-center py-10 text-faint font-mono text-sm">ยังไม่มี Prompt</p>
        )}
      </div>
    </div>
  )
}
