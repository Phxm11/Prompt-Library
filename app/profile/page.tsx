import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import Icon from '@/app/components/Icon'
import ProfileEditor from '@/app/components/ProfileEditor'

type Prompt = {
  prompt_id: string
  title: string
  prompt_text: string
  cover_image_url: string | null
  cover_position?: string | null
  status?: string | null
  view_count: number
  like_count: number
  copy_count?: number
  categories: { name: string } | null
  media_types: { name: string } | null
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return (
    <main className="max-w-6xl mx-auto px-6 py-20 text-center">
      <h1 className="section-title section-title-center text-4xl font-extrabold mb-3">โปรไฟล์ของฉัน</h1>
      <p className="text-muted mb-6">เข้าสู่ระบบเพื่อดู Prompt รายการโปรด และสถิติของคุณ</p>
      <Link href="/login?next=/profile" className="inline-flex px-5 py-2.5 rounded-lg font-mono text-sm bg-accent/10 text-accent border border-accent/60 hover:bg-accent/20 transition-all">เข้าสู่ระบบ</Link>
    </main>
  )

  const [createdResult, favoritesResult, profileResult] = await Promise.all([
    supabase.from('prompts').select('prompt_id, title, prompt_text, cover_image_url, cover_position, status, view_count, like_count, copy_count, categories(name), media_types(name)', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('favorites').select('favorite_id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('username, display_name, avatar_url, bio, username_changed_at').eq('id', user.id).maybeSingle(),
  ])

  const profile = profileResult.data

  const createdPrompts = (createdResult.data ?? []) as unknown as Prompt[]
  const totalViews = createdPrompts.reduce((sum, prompt) => sum + (prompt.view_count ?? 0), 0)
  const totalLikes = createdPrompts.reduce((sum, prompt) => sum + (prompt.like_count ?? 0), 0)
  const stats = [
    { label: 'Prompt ที่สร้าง', value: createdResult.count ?? 0, color: 'text-accent' },
    { label: 'รายการโปรด', value: favoritesResult.count ?? 0, color: 'text-accent2' },
    { label: 'ยอดเข้าชม', value: totalViews, color: 'text-accent' },
    { label: 'ถูกใจที่ได้รับ', value: totalLikes, color: 'text-accent2' },
  ]
  const statIcons = ['sparkles', 'heart', 'eye', 'star'] as const

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-9 mb-10 relative overflow-hidden">
        {/* แสงเรือง ๆ สองมุมให้การ์ดไม่แบน */}
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-accent2/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <h1 className="section-title text-4xl font-extrabold text-ink mb-7">โปรไฟล์ของฉัน</h1>

          <ProfileEditor
            userId={user.id}
            email={user.email ?? ''}
            username={profile?.username ?? ''}
            usernameChangedAt={profile?.username_changed_at ?? null}
            initialDisplayName={profile?.display_name ?? ''}
            initialAvatarUrl={profile?.avatar_url ?? null}
            initialBio={profile?.bio ?? ''}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-xl border border-line bg-base/70 px-4 py-4 transition-colors hover:border-accent/40"
              >
                <Icon name={statIcons[index]} size={18} className={`${stat.color} mb-2`} />
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString('th-TH')}</p>
                <p className="text-xs text-muted font-mono mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-5"><div><h2 className="section-title text-2xl font-extrabold text-ink">Prompt ที่ฉันสร้าง</h2></div><Link href="/prompts/new" className="text-sm text-accent hover:text-accent-soft">+ เพิ่ม Prompt</Link></div>
        {createdPrompts.length === 0 ? <div className="rounded-xl border border-dashed border-line text-center py-12 text-muted">ยังไม่มี Prompt ที่สร้างไว้</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{createdPrompts.map((prompt, i) => <PromptCard key={prompt.prompt_id} prompt={prompt} index={i} />)}</div>}
      </section>

      <section>
        <div className="rounded-xl border border-line bg-surface p-5"><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-ink">รายการโปรด</h2><Link href="/favorites" className="text-sm text-accent2 hover:text-accent2">ดูทั้งหมด →</Link></div><p className="text-muted text-sm">คุณบันทึก Prompt ที่ชอบไว้ {favoritesResult.count ?? 0} รายการ</p></div>
      </section>
    </main>
  )
}
