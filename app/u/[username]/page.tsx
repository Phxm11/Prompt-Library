import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import Icon from '@/app/components/Icon'

type Prompt = {
  prompt_id: string
  title: string
  prompt_text: string
  cover_image_url: string | null
  cover_position?: string | null
  view_count: number
  like_count: number
  copy_count?: number
  categories: { name: string } | null
  media_types: { name: string } | null
}

const PROMPT_LIMIT = 24

/**
 * โปรไฟล์สาธารณะของผู้ใช้คนอื่น
 *
 * โชว์เฉพาะสิ่งที่เจ้าตัวตั้งใจให้คนอื่นเห็น คือชื่อเล่น รูป ไบโอ และ prompt สาธารณะ
 * อีเมลไม่โชว์ และไม่ดึงมาด้วยซ้ำ เพราะอยู่ในตาราง auth ที่ฝั่งนี้ไม่ได้แตะอยู่แล้ว
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at')
    .eq('username', decodeURIComponent(username))
    .maybeSingle()

  if (!profile) notFound()

  /*
    เอาเฉพาะ prompt สาธารณะ คนดูจึงเห็นเท่าที่เจ้าของเปิดไว้ ไม่ว่าจะเป็นใครก็ตาม
    (RLS กันอีกชั้นอยู่แล้ว แต่กรองตรงนี้ด้วยจะได้ไม่ต้องพึ่ง policy อย่างเดียว)
  */
  const { data: prompts, count } = await supabase
    .from('prompts')
    .select(
      'prompt_id, title, prompt_text, cover_image_url, cover_position, view_count, like_count, copy_count, categories(name), media_types(name)',
      { count: 'exact' }
    )
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(PROMPT_LIMIT)

  const list = (prompts ?? []) as unknown as Prompt[]
  const name = profile.display_name?.trim() || profile.username
  const initial = name.charAt(0).toUpperCase()
  const totalViews = list.reduce((sum, p) => sum + (p.view_count ?? 0), 0)
  const totalLikes = list.reduce((sum, p) => sum + (p.like_count ?? 0), 0)

  const stats = [
    { label: 'Prompt สาธารณะ', value: count ?? list.length, color: 'text-accent', icon: 'sparkles' },
    { label: 'ยอดเข้าชม', value: totalViews, color: 'text-accent', icon: 'eye' },
    { label: 'ถูกใจที่ได้รับ', value: totalLikes, color: 'text-accent2', icon: 'heart' },
  ] as const

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <section className="animate-spring-up relative mb-10 overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-9">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-accent2/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-7 sm:flex-row sm:items-start">
          <div className="h-36 w-36 shrink-0 rounded-full bg-gradient-to-br from-accent via-accent/40 to-accent2 p-[3px] shadow-[0_0_36px_-8px_color-mix(in_srgb,var(--accent)_75%,transparent)] sm:h-40 sm:w-40">
            <div className="h-full w-full overflow-hidden rounded-full bg-base">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={`รูปโปรไฟล์ของ ${name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-5xl font-extrabold text-accent">
                  {initial}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl font-extrabold text-ink break-words">{name}</h1>
            <p className="mt-1 font-mono text-sm text-accent">@{profile.username}</p>
            {profile.bio?.trim() && (
              <p className="mt-3 text-sm text-ink-soft break-words">{profile.bio.trim()}</p>
            )}
            {profile.created_at && (
              <p className="mt-3 font-mono text-xs text-faint">
                เข้าร่วมเมื่อ{' '}
                {new Date(profile.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
              </p>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-line bg-base/70 px-4 py-4 transition-colors hover:border-accent/40"
                >
                  <Icon name={stat.icon} size={18} className={`${stat.color} mb-2`} />
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value.toLocaleString('th-TH')}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="animate-spring-up [animation-delay:60ms] section-title mb-5 text-2xl font-extrabold text-ink">
          Prompt ของ {name}
        </h2>

        {list.length === 0 ? (
          <div className="animate-spring-up [animation-delay:120ms] rounded-xl border border-dashed border-line py-12 text-center text-muted">
            ยังไม่มี Prompt สาธารณะ
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((prompt, i) => (
                <PromptCard key={prompt.prompt_id} prompt={prompt} index={i} />
              ))}
            </div>

            {(count ?? 0) > PROMPT_LIMIT && (
              <p className="mt-6 text-center font-mono text-sm text-faint">
                แสดง {PROMPT_LIMIT} จาก {count} รายการ
              </p>
            )}
          </>
        )}
      </section>

      <div className="mt-10 text-center">
        <Link href="/home" className="font-mono text-sm text-accent hover:text-accent-soft">
          ← กลับหน้ารายการ
        </Link>
      </div>
    </main>
  )
}
