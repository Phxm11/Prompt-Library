import { createClient } from '@/lib/supabase/server'
import AdminReviewActions from '@/app/admin/reviews/AdminReviewActions'
import AdminReviewFilters from '@/app/admin/reviews/AdminReviewFilters'

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ rating?: string; reviewer?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { rating, reviewer, q } = await searchParams

  let query = supabase
    .from('reviews')
    .select(
      'review_id, rating, comment, guest_name, created_at, prompt_id, prompts(title), profiles(username)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (rating) query = query.eq('rating', Number(rating))
  // สมาชิกคือแถวที่ผูก user_id ไว้ ส่วนผู้เยี่ยมชมรีวิวโดยไม่ล็อกอินจึงไม่มี user_id
  if (reviewer === 'member') query = query.not('user_id', 'is', null)
  if (reviewer === 'guest') query = query.is('user_id', null)

  /*
    ค้นหาให้ครอบทั้งข้อความรีวิว ชื่อผู้เยี่ยมชม และชื่อ prompt

    ชื่อ prompt อยู่คนละตาราง และ .or() ผสมเงื่อนไขข้ามตารางไม่ได้
    เลยหา prompt ที่ชื่อตรงคำค้นมาก่อน แล้วค่อยเอา id มาต่อเป็นอีกเงื่อนไขหนึ่ง

    ต้อง escape % _ \ เพราะเป็นอักขระพิเศษของ LIKE
    และตัด , ทิ้ง เพราะ .or() ใช้จุลภาคคั่นเงื่อนไข ถ้าไม่กันจะแตกเป็นสองเงื่อนไข
  */
  if (q) {
    const keyword = q.replace(/[%_\\]/g, (ch) => `\\${ch}`).replace(/,/g, '')
    const { data: matchedPrompts } = await supabase
      .from('prompts')
      .select('prompt_id')
      .ilike('title', `%${keyword}%`)
      .limit(200)

    const promptIds = (matchedPrompts ?? []).map((p) => p.prompt_id)
    const conditions = [`comment.ilike.%${keyword}%`, `guest_name.ilike.%${keyword}%`]
    if (promptIds.length > 0) conditions.push(`prompt_id.in.(${promptIds.join(',')})`)

    query = query.or(conditions.join(','))
  }

  const { data: reviews, error, count } = await query

  return (
    <div>
      <h1 className="animate-spring-up section-title text-3xl font-extrabold text-ink mb-6">
        จัดการรีวิว
      </h1>

      {error && <p className="text-accent2">เกิดข้อผิดพลาด: {error.message}</p>}

      <div className="animate-spring-up [animation-delay:60ms] relative z-20">
        <AdminReviewFilters total={count ?? reviews?.length ?? 0} />
      </div>

      <div className="flex flex-col gap-2.5">
        {reviews?.map((r: any, i: number) => (
          <div
            key={r.review_id}
            style={{ animationDelay: `${120 + Math.min(i, 12) * 55}ms` }}
            className="animate-spring-up rounded-lg bg-surface border border-line p-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-300 text-sm">{'★'.repeat(r.rating)}</span>
                <span className="text-faint text-xs font-mono">
                  {r.profiles?.username ? '@' + r.profiles.username : r.guest_name ?? 'ผู้เยี่ยมชม'}
                </span>
                <span className="text-faint text-xs font-mono">
                  · {new Date(r.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
              <p className="text-xs text-accent/80 font-mono mb-1 truncate">
                prompt: {r.prompts?.title ?? '(ถูกลบแล้ว)'}
              </p>
              {r.comment && <p className="text-sm text-ink-soft">{r.comment}</p>}
            </div>
            <AdminReviewActions reviewId={r.review_id} />
          </div>
        ))}

        {reviews?.length === 0 && (
          <p className="text-center py-10 text-faint font-mono text-sm">
            {rating || reviewer || q ? 'ไม่พบรีวิวที่ตรงกับตัวกรอง' : 'ยังไม่มีรีวิว'}
          </p>
        )}
      </div>
    </div>
  )
}
