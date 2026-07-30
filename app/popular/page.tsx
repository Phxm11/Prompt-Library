import { createClient } from '@/lib/supabase/server'

export default async function PopularPromptsPage() {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .rpc('get_popular_prompts', { result_limit: 20 })

  type PromptData = {
    prompt_id: string
    title: string
    prompt_text: string
    cover_image_url: string | null
    view_count: number
    like_count: number
    copy_count: number
    copy_uses: number
    category_name: string | null
    media_type_name: string | null
  }

  const prompts: PromptData[] = (rows ?? []).map((r: any) => ({
    prompt_id: r.prompt_id,
    title: r.title,
    prompt_text: r.prompt_text,
    cover_image_url: r.cover_image_url,
    view_count: r.view_count,
    like_count: r.like_count,
    copy_count: r.copy_count,
    copy_uses: r.copy_uses,
    category_name: r.category_name,
    media_type_name: r.media_type_name,
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="animate-spring-up section-title text-4xl font-extrabold mb-1 text-ink">
        ยอดนิยม
      </h1>
      <p className="animate-spring-up [animation-delay:60ms] text-muted text-sm mb-8">
        เรียงตามจำนวนคนที่คัดลอกไปใช้งานจริง (นับคนละครั้งเดียว)
      </p>

      {error && <p className="text-accent2">เกิดข้อผิดพลาด: {error.message}</p>}

      {prompts.length === 0 && (
        <p className="text-muted font-mono text-sm py-12 text-center">
          {'>'} ยังไม่มีข้อมูลการใช้งาน
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {prompts.map((p, idx: number) => (
          <a
            key={p.prompt_id}
            href={`/prompts/${p.prompt_id}`}
            style={{ animationDelay: `${120 + Math.min(idx, 12) * 55}ms` }}
            className="animate-spring-up group flex items-center gap-4 p-4 rounded-xl bg-surface border border-line hover:border-accent/60 hover:shadow-[0_10px_30px_-10px_color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-1 transition-[translate,box-shadow,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            {/* อันดับ */}
            <span
              className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                idx === 0
                  ? 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/40'
                  : idx === 1
                  ? 'bg-gray-300/10 text-gray-300 border border-gray-300/30'
                  : idx === 2
                  ? 'bg-orange-400/10 text-orange-300 border border-orange-400/40'
                  : 'bg-base text-faint border border-line'
              }`}
            >
              {idx + 1}
            </span>

            {/* ภาพย่อ */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-base shrink-0">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-faint text-[10px] font-mono">
                  no img
                </div>
              )}
            </div>

            {/* ข้อมูล */}
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 mb-1">
                {p.category_name && (
                  <span className="text-[10px] font-mono bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                    {p.category_name}
                  </span>
                )}
                {p.media_type_name && (
                  <span className="text-[10px] font-mono bg-accent2/10 text-accent2 border border-accent2/30 px-2 py-0.5 rounded-full">
                    {p.media_type_name}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-ink truncate group-hover:text-accent transition-colors">
                {p.title}
              </h3>
            </div>

            {/* จำนวนคัดลอก */}
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold font-mono text-accent">{p.copy_uses}</p>
              <p className="text-[10px] text-faint font-mono uppercase">users</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}