'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StarRating from '@/app/components/StarRating'

type Review = {
  review_id: string
  user_id: string | null
  guest_name: string | null
  rating: number
  comment: string | null
  created_at: string
  profiles: { username: string; display_name: string | null } | null
}

const MY_REVIEWS_KEY = 'prompt_library_my_review_ids'

function getMyReviewIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(MY_REVIEWS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function addMyReviewId(id: string) {
  const ids = getMyReviewIds()
  localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify([...ids, id]))
}

export default function ReviewSection({ promptId }: { promptId: string }) {
  const supabase = createClient()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [myReviewIds, setMyReviewIds] = useState<string[]>([])

  const [rating, setRating] = useState(0)
  const [guestName, setGuestName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMyReviewIds(getMyReviewIds())
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('review_id, user_id, guest_name, rating, comment, created_at, profiles(username, display_name)')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })

    setReviews((data as any) ?? [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('กรุณาให้คะแนนอย่างน้อย 1 ดาว')
      return
    }

    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: inserted, error: insertError } = await supabase
        .from('reviews')
        .insert({
          prompt_id: promptId,
          user_id: user?.id ?? null,
          guest_name: user ? null : guestName.trim() || 'ผู้เยี่ยมชม',
          rating,
          comment: comment.trim() || null,
        })
        .select('review_id, user_id, guest_name, rating, comment, created_at, profiles(username, display_name)')
        .single()

      if (insertError) throw insertError

      addMyReviewId(inserted.review_id)
      setMyReviewIds((prev) => [...prev, inserted.review_id])
      setReviews((prev) => [inserted as any, ...prev])

      setRating(0)
      setComment('')
      setGuestName('')
    } catch (err: any) {
      setError(err.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(reviewId: string) {
    const { error: deleteError } = await supabase.from('reviews').delete().eq('review_id', reviewId)
    if (!deleteError) {
      setReviews((prev) => prev.filter((r) => r.review_id !== reviewId))
    }
  }

  const inputClass =
    'w-full bg-[#12121c] border border-[#232336] rounded-lg px-3.5 py-2.5 text-sm text-[#f2f2f7] placeholder:text-[#666680] focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

  return (
    <div className="mt-10 pt-8 border-t border-[#232336]">
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-4 uppercase">
        // reviews · {reviews.length}
      </p>

      {/* ฟอร์มให้คะแนน */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#12121c] border border-[#232336] rounded-lg p-4 mb-6 space-y-3"
      >
        {error && (
          <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <p className="text-xs font-mono text-[#8888a0] mb-1.5">ให้คะแนน</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="ชื่อของคุณ (ถ้าไม่ระบุจะแสดงเป็น 'ผู้เยี่ยมชม')"
          className={inputClass}
          maxLength={50}
        />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="เขียนความคิดเห็นเกี่ยวกับ prompt นี้..."
          rows={3}
          className={`${inputClass} resize-none`}
        />

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg font-mono text-sm bg-cyan-500/10 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-all disabled:opacity-50"
        >
          {submitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
      </form>

      {/* รายการรีวิว */}
      {loading && <p className="text-[#666680] font-mono text-sm">กำลังโหลด...</p>}

      {!loading && reviews.length === 0 && (
        <p className="text-[#666680] font-mono text-sm py-6 text-center">
          {'>'} ยังไม่มีรีวิว เป็นคนแรกที่ให้คะแนน prompt นี้สิ
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => {
          const isMine = myReviewIds.includes(review.review_id)
          const displayName =
            review.profiles?.display_name || review.profiles?.username || review.guest_name || 'ผู้เยี่ยมชม'

          return (
            <div
              key={review.review_id}
              className="bg-[#12121c] border border-[#232336] rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#f2f2f7]">{displayName}</span>
                    {isMine && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                        คุณ
                      </span>
                    )}
                  </div>
                  <StarRating value={review.rating} readOnly size={14} />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[#666680] font-mono">
                    {new Date(review.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                  </span>
                  {isMine && (
                    <button
                      onClick={() => handleDelete(review.review_id)}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-mono"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-[#c8c8d4] mt-2 leading-relaxed">{review.comment}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}