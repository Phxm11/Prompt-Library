import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import Icon from '@/app/components/Icon'

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

type HistoryRow = {
  history_id: string
  action_type: string
  used_at: string
  prompts: { prompt_id: string; title: string }[] | null
}

type HistoryItem = Omit<HistoryRow, 'prompts'> & {
  prompts: { prompt_id: string; title: string } | null
}

const actionLabels: Record<string, string> = {
  view: 'ดูรายละเอียด', copy: 'คัดลอก Prompt', like: 'เพิ่มรายการโปรด', use: 'ใช้งาน Prompt', download: 'ดาวน์โหลด',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return (
    <main className="max-w-6xl mx-auto px-6 py-20 text-center">
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-4 uppercase">// profile</p>
      <h1 className="text-3xl font-bold mb-3">โปรไฟล์ของฉัน</h1>
      <p className="text-[#8888a0] mb-6">เข้าสู่ระบบเพื่อดู Prompt รายการโปรด และสถิติของคุณ</p>
      <Link href="/login?next=/profile" className="inline-flex px-5 py-2.5 rounded-lg font-mono text-sm bg-cyan-500/10 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/20 transition-all">เข้าสู่ระบบ</Link>
    </main>
  )

  const [createdResult, favoritesResult, historyResult] = await Promise.all([
    supabase.from('prompts').select('prompt_id, title, prompt_text, cover_image_url, view_count, like_count, copy_count, categories(name), media_types(name)', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('favorites').select('favorite_id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('usage_history').select('history_id, action_type, used_at, prompts(prompt_id, title)').eq('user_id', user.id).order('used_at', { ascending: false }).limit(5),
  ])

  const createdPrompts = (createdResult.data ?? []) as unknown as Prompt[]
  const history = ((historyResult.data ?? []) as unknown as HistoryRow[]).map((item) => ({
    ...item,
    prompts: item.prompts?.[0] ?? null,
  }))
  const totalViews = createdPrompts.reduce((sum, prompt) => sum + (prompt.view_count ?? 0), 0)
  const totalLikes = createdPrompts.reduce((sum, prompt) => sum + (prompt.like_count ?? 0), 0)
  const stats = [
    { label: 'Prompt ที่สร้าง', value: createdResult.count ?? 0, color: 'text-cyan-300' },
    { label: 'รายการโปรด', value: favoritesResult.count ?? 0, color: 'text-fuchsia-300' },
    { label: 'ยอดเข้าชม', value: totalViews, color: 'text-cyan-300' },
    { label: 'ถูกใจที่ได้รับ', value: totalLikes, color: 'text-fuchsia-300' },
  ]
  const statIcons = ['sparkles', 'heart', 'eye', 'star'] as const

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <section className="rounded-2xl border border-[#232336] bg-[#12121c] p-6 sm:p-8 mb-10 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">// profile</p>
        <h1 className="text-3xl font-bold text-[#f2f2f7]">โปรไฟล์ของฉัน</h1>
        <p className="text-[#8888a0] mt-1">{user.email}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
          {stats.map((stat, index) => <div key={stat.label} className="rounded-xl border border-[#232336] bg-[#0a0a0f]/70 px-4 py-4"><Icon name={statIcons[index]} size={18} className={`${stat.color} mb-2`} /><p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString('th-TH')}</p><p className="text-xs text-[#8888a0] font-mono mt-1">{stat.label}</p></div>)}
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-5"><div><p className="text-xs tracking-[0.2em] text-cyan-400/80 font-mono uppercase">// my_prompts</p><h2 className="text-2xl font-bold text-[#f2f2f7] mt-1">Prompt ที่ฉันสร้าง</h2></div><Link href="/prompts/new" className="text-sm text-cyan-300 hover:text-cyan-200">+ เพิ่ม Prompt</Link></div>
        {createdPrompts.length === 0 ? <div className="rounded-xl border border-dashed border-[#232336] text-center py-12 text-[#8888a0]">ยังไม่มี Prompt ที่สร้างไว้</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{createdPrompts.map((prompt) => <PromptCard key={prompt.prompt_id} prompt={prompt} />)}</div>}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#232336] bg-[#12121c] p-5"><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-[#f2f2f7]">รายการโปรด</h2><Link href="/favorites" className="text-sm text-fuchsia-300 hover:text-fuchsia-200">ดูทั้งหมด →</Link></div><p className="text-[#8888a0] text-sm">คุณบันทึก Prompt ที่ชอบไว้ {favoritesResult.count ?? 0} รายการ</p></div>
        <div className="rounded-xl border border-[#232336] bg-[#12121c] p-5"><div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-[#f2f2f7]">ประวัติล่าสุด</h2><Link href="/history" className="text-sm text-cyan-300 hover:text-cyan-200">ดูทั้งหมด →</Link></div>{history.length === 0 ? <p className="text-[#8888a0] text-sm">ยังไม่มีประวัติการใช้งาน</p> : <div className="space-y-3">{history.map((item) => <Link key={item.history_id} href={item.prompts ? `/prompts/${item.prompts.prompt_id}` : '/history'} className="block group"><p className="text-sm text-[#c8c8d4] group-hover:text-cyan-300 truncate">{item.prompts?.title ?? 'Prompt ที่ถูกลบแล้ว'}</p><p className="text-xs text-[#666680] mt-0.5">{actionLabels[item.action_type] ?? item.action_type} · {new Date(item.used_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p></Link>)}</div>}</div>
      </section>
    </main>
  )
}
