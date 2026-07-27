import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats')

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#f2f2f7] mb-4">ภาพรวม</h1>
        <p className="text-fuchsia-400">โหลดสถิติไม่สำเร็จ: {error?.message}</p>
      </div>
    )
  }

  const stats = [
    { label: 'ผู้ใช้ทั้งหมด', value: data.total_users, accent: 'cyan' },
    { label: 'ผู้ใช้ที่ถูกแบน', value: data.banned_users, accent: 'fuchsia' },
    { label: 'Prompt ทั้งหมด', value: data.total_prompts, accent: 'cyan' },
    { label: 'Prompt สาธารณะ', value: data.public_prompts, accent: 'cyan' },
    { label: 'รีวิวทั้งหมด', value: data.total_reviews, accent: 'fuchsia' },
    { label: 'รายการโปรดทั้งหมด', value: data.total_favorites, accent: 'fuchsia' },
    { label: 'ยอดดูรวม', value: data.total_views, accent: 'cyan' },
    { label: 'ยอดคัดลอกรวม', value: data.total_copies, accent: 'cyan' },
    { label: 'ผู้ใช้ใหม่ (7 วัน)', value: data.new_users_last_7_days, accent: 'fuchsia' },
    { label: 'Prompt ใหม่ (7 วัน)', value: data.new_prompts_last_7_days, accent: 'fuchsia' },
  ]

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-fuchsia-400/80 font-mono mb-2 uppercase">
        // dashboard
      </p>
      <h1
        className="text-2xl font-bold text-[#f2f2f7] mb-8"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        ภาพรวมระบบ
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-[#12121c] border border-[#232336] p-5"
          >
            <p className="text-xs text-[#666680] font-mono mb-1">{s.label}</p>
            <p
              className={`text-2xl font-bold font-mono ${
                s.accent === 'cyan' ? 'text-cyan-300' : 'text-fuchsia-300'
              }`}
            >
              {s.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      {data.prompts_by_category && (
        <div>
          <p className="text-xs font-mono text-[#666680] tracking-widest uppercase mb-3">
            Prompt แยกตามหมวดหมู่
          </p>
          <div className="rounded-xl bg-[#12121c] border border-[#232336] p-5 space-y-3">
            {data.prompts_by_category.map((c: any) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm text-[#c8c8d4] w-32 shrink-0 font-mono">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[#0a0a0f] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                    style={{
                      width: `${Math.min(
                        (c.prompt_count / Math.max(data.total_prompts, 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-[#666680] font-mono w-8 text-right">
                  {c.prompt_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}