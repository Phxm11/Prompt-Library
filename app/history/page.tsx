import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const actionLabel: Record<string, string> = {
  view: 'ดูรายละเอียด',
  copy: 'คัดลอก prompt',
  like: 'ถูกใจ / บันทึกรายการโปรด',
  use: 'ใช้งาน',
  download: 'ดาวน์โหลด',
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-4 uppercase">
          // usage_history
        </p>
        <p className="text-[#8888a0] font-mono text-sm">
          {'>'} กรุณาเข้าสู่ระบบเพื่อดูประวัติการใช้งานของคุณ
        </p>
      </div>
    )
  }

  const { data: history, error } = await supabase
    .from('usage_history')
    .select('history_id, action_type, used_at, prompts(prompt_id, title)')
    .eq('user_id', user.id)
    .order('used_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // usage_history
      </p>
      <h1
        className="text-3xl font-bold mb-1 text-[#f2f2f7]"
      >
        ประวัติการใช้งาน
      </h1>
      <p className="text-[#8888a0] text-sm mb-8">50 รายการล่าสุด</p>

      {error && <p className="text-fuchsia-400">เกิดข้อผิดพลาด: {error.message}</p>}

      {history && history.length === 0 && (
        <p className="text-[#8888a0] font-mono text-sm py-12 text-center">
          {'>'} ยังไม่มีประวัติการใช้งาน
        </p>
      )}

      <div className="flex flex-col gap-2">
        {history?.map((h: any) => (
          <Link
            key={h.history_id}
            href={h.prompts ? `/prompts/${h.prompts.prompt_id}` : '#'}
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#12121c] border border-[#232336] hover:border-cyan-400/60 transition-all"
          >
            <div>
              <p className="text-sm text-[#f2f2f7]">{h.prompts?.title ?? 'Prompt ถูกลบแล้ว'}</p>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">
                {actionLabel[h.action_type] ?? h.action_type}
              </p>
            </div>
            <p className="text-xs text-[#666680] font-mono shrink-0 ml-4">
              {new Date(h.used_at).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}