import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats')

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink mb-4">ภาพรวม</h1>
        <p className="text-accent2">โหลดสถิติไม่สำเร็จ: {error?.message}</p>
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
      <h1 className="animate-spring-up section-title text-3xl font-extrabold text-ink mb-8">
        ภาพรวมระบบ
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{ animationDelay: `${120 + i * 55}ms` }}
            className="animate-spring-up rounded-xl bg-surface border border-line p-5"
          >
            <p className="text-xs text-faint font-mono mb-1">{s.label}</p>
            <p
              className={`text-2xl font-bold font-mono ${
                s.accent === 'cyan' ? 'text-accent' : 'text-accent2'
              }`}
            >
              {s.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      {data.prompts_by_category && (
        <div className="animate-spring-up [animation-delay:700ms]">
          <p className="text-xs font-mono text-faint tracking-widest uppercase mb-3">
            Prompt แยกตามหมวดหมู่
          </p>
          <div className="rounded-xl bg-surface border border-line p-5 space-y-3">
            {data.prompts_by_category.map((c: any) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm text-ink-soft w-32 shrink-0 font-mono">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-base overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent2"
                    style={{
                      width: `${Math.min(
                        (c.prompt_count / Math.max(data.total_prompts, 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-faint font-mono w-8 text-right">
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
