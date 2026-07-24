import { createClient } from '@/lib/supabase/server'
import CategoryFilter from '@/app/components/CategoryFilter'
import PromptInfiniteGrid from '@/app/components/PromptInfiniteGrid'

const PAGE_SIZE = 12

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  // ดึงหมวดหมู่ทั้งหมดสำหรับแถบ filter
  const { data: categories } = await supabase
    .from('categories')
    .select('category_id, name, slug')
    .eq('is_active', true)
    .order('sort_order')

  // หา category_id จาก slug (ถ้ามีการ filter)
  const matchedCategory = category
    ? categories?.find((c) => c.slug === category)
    : undefined
  const categoryId = matchedCategory?.category_id ?? null

  // ดึงเฉพาะหน้าแรก (12 รายการ) พร้อมนับจำนวนทั้งหมดที่ตรงเงื่อนไข
  // เพื่อรู้ว่ายังมีข้อมูลให้โหลดเพิ่มไหม (infinite scroll)
  let query = supabase
    .from('prompts')
    .select('*, categories(name), media_types(name)', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .order('prompt_id', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: prompts, count, error } = await query

  const hasMore = (count ?? 0) > PAGE_SIZE

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

        <CategoryFilter categories={categories ?? []} />

        {error && (
          <p className="text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg px-4 py-3 mt-4">
            เกิดข้อผิดพลาด: {error.message}
          </p>
        )}

        {prompts && prompts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#8888a0] font-mono text-sm">
              {'>'} ยังไม่มี Prompt ในหมวดหมู่นี้
            </p>
          </div>
        )}

        <div className="mt-6">
          {/* key เปลี่ยนตาม category ทำให้ component รีเซ็ต state ใหม่หมด
              เวลาเปลี่ยนหมวดหมู่ (ไม่ต้องเขียน logic reset เอง) */}
          <PromptInfiniteGrid
            key={categoryId ?? 'all'}
            initialPrompts={prompts ?? []}
            initialHasMore={hasMore}
            mode="browse"
            categoryId={categoryId}
          />
        </div>
      </div>
    </div>
  )
}