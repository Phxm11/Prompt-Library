import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ยังไม่ได้ login - แจ้งให้เข้าสู่ระบบก่อน
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-4 uppercase">
          // favorites
        </p>
        <p className="text-[#8888a0] font-mono text-sm">
          {'>'} กรุณาเข้าสู่ระบบเพื่อดูรายการโปรดของคุณ
        </p>
      </div>
    )
  }

  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('created_at, prompts(*, categories(name), media_types(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const prompts = (favorites ?? []).map((f: any) => f.prompts)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // favorites
      </p>
      <h1
        className="text-3xl font-bold mb-1 text-[#f2f2f7]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        รายการโปรด
      </h1>
      <p className="text-[#8888a0] text-sm mb-8">Prompt ที่คุณบันทึกไว้</p>

      {error && <p className="text-fuchsia-400">เกิดข้อผิดพลาด: {error.message}</p>}

      {prompts.length === 0 && (
        <p className="text-[#8888a0] font-mono text-sm py-12 text-center">
          {'>'} ยังไม่มี Prompt ในรายการโปรด
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {prompts.map((prompt: any) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} />
        ))}
      </div>
    </div>
  )
}