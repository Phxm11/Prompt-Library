import { createClient } from '@/lib/supabase/server'
import AdminReviewActions from '@/app/admin/reviews/AdminReviewActions.tsx'

export default async function AdminReviewsPage() {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('review_id, rating, comment, guest_name, created_at, prompts(title), profiles(username)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-fuchsia-400/80 font-mono mb-2 uppercase">
        // reviews
      </p>
      <h1
        className="text-2xl font-bold text-[#f2f2f7] mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        จัดการรีวิว
      </h1>

      {error && <p className="text-fuchsia-400">เกิดข้อผิดพลาด: {error.message}</p>}

      <div className="flex flex-col gap-2.5">
        {reviews?.map((r: any) => (
          <div
            key={r.review_id}
            className="rounded-lg bg-[#12121c] border border-[#232336] p-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-300 text-sm">{'★'.repeat(r.rating)}</span>
                <span className="text-[#666680] text-xs font-mono">
                  {r.profiles?.username ? '@' + r.profiles.username : r.guest_name ?? 'ผู้เยี่ยมชม'}
                </span>
                <span className="text-[#666680] text-xs font-mono">
                  · {new Date(r.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
              <p className="text-xs text-cyan-400/80 font-mono mb-1 truncate">
                prompt: {r.prompts?.title ?? '(ถูกลบแล้ว)'}
              </p>
              {r.comment && <p className="text-sm text-[#c8c8d4]">{r.comment}</p>}
            </div>
            <AdminReviewActions reviewId={r.review_id} />
          </div>
        ))}

        {reviews?.length === 0 && (
          <p className="text-center py-10 text-[#666680] font-mono text-sm">ยังไม่มีรีวิว</p>
        )}
      </div>
    </div>
  )
}