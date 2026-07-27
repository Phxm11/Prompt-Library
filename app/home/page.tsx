import { createClient } from '@/lib/supabase/server'
import PromptFilters from '@/app/components/PromptFilters'
import PromptInfiniteGrid from '@/app/components/PromptInfiniteGrid'

const PAGE_SIZE = 12

export default async function BrowsePromptsPage({
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
    <div className="min-h-screen bg-base relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 'var(--grid-opacity)',
          backgroundImage:
            'linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none glow-blob" />
      <div className="absolute -top-20 right-0 w-96 h-96 bg-accent2/20 rounded-full blur-[120px] pointer-events-none glow-blob" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="animate-spring-up mb-10">
          <h1 className="section-title text-4xl font-extrabold mb-2 bg-gradient-to-r from-accent via-accent-soft to-accent2 bg-clip-text text-transparent">
            เลือกดู Prompt
          </h1>
          <p className="text-muted text-sm">
            รวม Prompt AI สำหรับสร้างรูปภาพ วิดีโอ และงานนำเสนอ
          </p>
        </div>

        {/*
          ต้อง relative z-30 ที่ชั้นนี้ ไม่ใช่ที่ตัว dropdown เพราะ animate-spring-up ใช้ transform
          ซึ่งสร้าง stacking context ใหม่ z-index ของลูกจึงไปสู้กับกริดการ์ดข้างนอกไม่ได้
        */}
        <div className="animate-spring-up [animation-delay:60ms] relative z-30">
          <PromptFilters
            categories={(categories ?? []).map((c) => ({ id: c.category_id, name: c.name, slug: c.slug }))}
            mediaTypes={(mediaTypes ?? []).map((m) => ({ id: m.media_type_id, name: m.name, slug: m.slug }))}
            aiModels={(aiModels ?? []).map((a) => ({ id: a.ai_model_id, name: a.name }))}
          />
        </div>

        {error && (
          <p className="text-accent2 bg-accent2/10 border border-accent2/30 rounded-lg px-4 py-3 mt-4">
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
