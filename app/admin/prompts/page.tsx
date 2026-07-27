import { createClient } from '@/lib/supabase/server'
import AdminPromptActions from '@/app/admin/prompts/AdminPromptActions'

export default async function AdminPromptsPage() {
  const supabase = await createClient()

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('prompt_id, title, is_public, view_count, copy_count, created_at, categories(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-fuchsia-400/80 font-mono mb-2 uppercase">
        // prompts
      </p>
      <h1
        className="text-2xl font-bold text-[#f2f2f7] mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        จัดการ Prompt ทั้งหมด
      </h1>

      {error && <p className="text-fuchsia-400">เกิดข้อผิดพลาด: {error.message}</p>}

      <div className="rounded-xl bg-[#12121c] border border-[#232336] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#232336] text-left text-[#666680] font-mono text-xs">
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
              <tr key={p.prompt_id} className="border-b border-[#232336] last:border-0">
                <td className="px-4 py-3 text-[#f2f2f7] max-w-xs truncate">{p.title}</td>
                <td className="px-4 py-3 text-[#8888a0] font-mono text-xs">
                  {p.categories?.name ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      p.is_public
                        ? 'bg-cyan-500/10 text-cyan-300'
                        : 'bg-[#232336] text-[#8888a0]'
                    }`}
                  >
                    {p.is_public ? 'สาธารณะ' : 'ส่วนตัว'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#8888a0] font-mono text-xs">
                  {p.view_count} / {p.copy_count}
                </td>
                <td className="px-4 py-3 text-[#666680] font-mono text-xs">
                  {new Date(p.created_at).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">
                  <AdminPromptActions promptId={p.prompt_id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {prompts?.length === 0 && (
          <p className="text-center py-10 text-[#666680] font-mono text-sm">ยังไม่มี Prompt</p>
        )}
      </div>
    </div>
  )
}