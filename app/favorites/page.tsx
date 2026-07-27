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
        <h1 className="animate-spring-up section-title section-title-center text-4xl font-extrabold mb-3 text-ink">รายการโปรด</h1>
        <p className="animate-spring-up [animation-delay:60ms] text-muted mb-6">เข้าสู่ระบบเพื่อดู Prompt ที่คุณบันทึกไว้</p>
        <Link
          href="/login?next=/favorites"
          className="inline-flex px-5 py-2.5 rounded-lg font-mono text-sm bg-accent/10 text-accent border border-accent/60 hover:bg-accent/20 transition-all"
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
      <h1 className="animate-spring-up section-title text-4xl font-extrabold mb-1 text-ink">รายการโปรด</h1>
      <p className="animate-spring-up [animation-delay:60ms] text-muted text-sm mb-8">Prompt ที่คุณบันทึกไว้</p>

      {error && (
        <p className="text-accent2 bg-accent2/10 border border-accent2/30 rounded-lg px-4 py-3">
          เกิดข้อผิดพลาด: {error.message}
        </p>
      )}

      {!error && prompts.length === 0 && (
        <div className="animate-spring-up [animation-delay:120ms] text-center py-16 border border-dashed border-line rounded-xl">
          <p className="text-muted font-mono text-sm">{'> '}ยังไม่มี Prompt ในรายการโปรด</p>
          <Link href="/home" className="inline-block mt-4 text-sm text-accent hover:text-accent-soft">
            ไปเลือก Prompt
          </Link>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((prompt, i) => (
            <PromptCard key={prompt.prompt_id} prompt={prompt} index={i + 2} />
          ))}
        </div>
      )}
    </main>
  )
}
