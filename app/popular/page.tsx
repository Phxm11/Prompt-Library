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
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // popular_prompts
      </p>
      <h1
        className="text-3xl font-bold mb-1 text-[#f2f2f7]"
      >
        ยอดนิยม
      </h1>
      <p className="text-[#8888a0] text-sm mb-8">
        เรียงตามจำนวนครั้งที่ถูกคัดลอกไปใช้งานจริง (จาก usage_history)
      </p>

      {error && <p className="text-fuchsia-400">เกิดข้อผิดพลาด: {error.message}</p>}

      {prompts.length === 0 && (
        <p className="text-[#8888a0] font-mono text-sm py-12 text-center">
          {'>'} ยังไม่มีข้อมูลการใช้งาน
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {prompts.map((p, idx: number) => (
          <a
            key={p.prompt_id}
            href={`/prompts/${p.prompt_id}`}
            className="group flex items-center gap-4 p-4 rounded-xl bg-[#12121c] border border-[#232336] hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all"
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
                  : 'bg-[#0a0a0f] text-[#666680] border border-[#232336]'
              }`}
            >
              {idx + 1}
            </span>

            {/* ภาพย่อ */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0a0a0f] shrink-0">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#666680] text-[10px] font-mono">
                  no img
                </div>
              )}
            </div>

            {/* ข้อมูล */}
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 mb-1">
                {p.category_name && (
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    {p.category_name}
                  </span>
                )}
                {p.media_type_name && (
                  <span className="text-[10px] font-mono bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded-full">
                    {p.media_type_name}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[#f2f2f7] truncate group-hover:text-cyan-300 transition-colors">
                {p.title}
              </h3>
            </div>

            {/* จำนวนคัดลอก */}
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold font-mono text-cyan-300">{p.copy_uses}</p>
              <p className="text-[10px] text-[#666680] font-mono uppercase">copies</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}