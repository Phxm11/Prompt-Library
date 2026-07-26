import { createClient } from '@/lib/supabase/server'
import PromptFilters from '@/app/components/PromptFilters'
import PromptInfiniteGrid from '@/app/components/PromptInfiniteGrid'

const PAGE_SIZE = 12

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; media_type?: string; ai_model?: string }>
}) {
  const { category, media_type, ai_model } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('category_id, name, slug')
    .eq('is_active', true)
    .order('sort_order')

  const { data: mediaTypes } = await supabase
    .from('media_types')
    .select('media_type_id, name, slug')
    .order('name')

  const { data: aiModels } = await supabase
    .from('ai_models')
    .select('ai_model_id, name')
    .eq('is_active', true)
    .order('name')

  const categoryId = category
    ? categories?.find((c) => c.slug === category)?.category_id ?? null
    : null
  const mediaTypeId = media_type
    ? mediaTypes?.find((m) => m.slug === media_type)?.media_type_id ?? null
    : null
  const aiModelId = ai_model ?? null

  // Server ดึงแค่ category + media_type เท่านั้น (เร็ว ไม่ซับซ้อน)
  // ถ้ามีการกรองด้วยโมเดล AI ด้วย จะให้ PromptInfiniteGrid ไป fetch ซ้ำ
  // ฝั่ง client อีกทีตอน mount แทน (ดู logic ใน component นั้น)
  let query = supabase
    .from('prompts')
    .select('*, categories(name), media_types(name)', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .order('prompt_id', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  if (categoryId) query = query.eq('category_id', categoryId)
  if (mediaTypeId) query = query.eq('media_type_id', mediaTypeId)

  const { data: prompts, count, error } = await query

  const hasMore = (count ?? 0) > PAGE_SIZE
  const filterKey = `${categoryId ?? 'all'}-${mediaTypeId ?? 'all'}-${aiModelId ?? 'all'}`

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-20 right-0 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
            // prompt_library.init
          </p>
          <h1
            className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-cyan-200 to-fuchsia-400 bg-clip-text text-transparent"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Prompt Library
          </h1>
          <p className="text-[#8888a0] text-sm">
            รวม Prompt AI สำหรับสร้างรูปภาพ วิดีโอ และงานนำเสนอ
          </p>
        </div>

        <PromptFilters
          categories={(categories ?? []).map((c) => ({ id: c.category_id, name: c.name, slug: c.slug }))}
          mediaTypes={(mediaTypes ?? []).map((m) => ({ id: m.media_type_id, name: m.name, slug: m.slug }))}
          aiModels={(aiModels ?? []).map((a) => ({ id: a.ai_model_id, name: a.name }))}
        />

        {error && (
          <p className="text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg px-4 py-3 mt-4">
            เกิดข้อผิดพลาด: {error.message}
          </p>
        )}

        <div className="mt-6">
          <PromptInfiniteGrid
            key={filterKey}
            initialPrompts={prompts ?? []}
            initialHasMore={hasMore}
            mode="browse"
            categoryId={categoryId}
            mediaTypeId={mediaTypeId}
            aiModelId={aiModelId}
          />
        </div>
      </div>
    </div>
  )
}