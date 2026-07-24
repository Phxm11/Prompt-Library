import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'

type Prompt = {
  prompt_id: string
  title: string
  prompt_text: string
  cover_image_url: string | null
  view_count: number
  like_count: number
  copy_count?: number
  categories: { name: string } | null
  media_types: { name: string } | null
}

export default async function FavoritesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-4 uppercase">
          // favorites
        </p>
        <h1 className="text-3xl font-bold mb-3 text-[#f2f2f7]">รายการโปรด</h1>
        <p className="text-[#8888a0] mb-6">เข้าสู่ระบบเพื่อดู Prompt ที่คุณบันทึกไว้</p>
        <Link
          href="/login?next=/favorites"
          className="inline-flex px-5 py-2.5 rounded-lg font-mono text-sm bg-cyan-500/10 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/20 transition-all"
        >
          เข้าสู่ระบบ
        </Link>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('created_at, prompts(prompt_id, title, prompt_text, cover_image_url, view_count, like_count, copy_count, categories(name), media_types(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const prompts: Prompt[] = (data ?? [])
    .flatMap((favorite) => favorite.prompts ?? [])
    .map((prompt) => ({
      ...prompt,
      categories: prompt.categories?.[0] ?? null,
      media_types: prompt.media_types?.[0] ?? null,
    }))

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // favorites
      </p>
      <h1 className="text-3xl font-bold mb-1 text-[#f2f2f7]">รายการโปรด</h1>
      <p className="text-[#8888a0] text-sm mb-8">Prompt ที่คุณบันทึกไว้</p>

      {error && (
        <p className="text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg px-4 py-3">
          เกิดข้อผิดพลาด: {error.message}
        </p>
      )}

      {!error && prompts.length === 0 && (
        <div className="text-center py-16 border border-dashed border-[#232336] rounded-xl">
          <p className="text-[#8888a0] font-mono text-sm">{'> '}ยังไม่มี Prompt ในรายการโปรด</p>
          <Link href="/" className="inline-block mt-4 text-sm text-cyan-300 hover:text-cyan-200">
            ไปเลือก Prompt
          </Link>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.prompt_id} prompt={prompt} />
          ))}
        </div>
      )}
    </main>
  )
}
