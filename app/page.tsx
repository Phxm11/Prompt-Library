import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import CategoryFilter from '@/app/components/CategoryFilter'

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

  // สร้าง query สำหรับ prompts
  let query = supabase
    .from('prompts')
    .select('*, categories(name), media_types(name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // ถ้ามี filter หมวดหมู่ ต้องหา category_id จาก slug ก่อน
  if (category) {
    const matchedCategory = categories?.find((c) => c.slug === category)
    if (matchedCategory) {
      query = query.eq('category_id', matchedCategory.category_id)
    }
  }

  const { data: prompts, error } = await query

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* พื้นผิว grid บางๆ แบบ HUD ให้ความรู้สึก tech-lab */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* แสง glow ลอยที่มุมบน ให้บรรยากาศ ambient */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {prompts?.map((prompt) => (
            <PromptCard key={prompt.prompt_id} prompt={prompt} />
          ))}
        </div>
      </div>
    </div>
  )
}