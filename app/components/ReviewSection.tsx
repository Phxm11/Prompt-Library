'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StarRating from '@/app/components/StarRating'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { showToast } from '@/app/components/Toast'
import { checkProfanity } from '@/lib/profanity'

type Review = {
  review_id: string
  user_id: string | null
  guest_name: string | null
  rating: number
  comment: string | null
  created_at: string
  is_anonymous: boolean
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
}

const SELECT_COLUMNS =
  'review_id, user_id, guest_name, rating, comment, created_at, is_anonymous, profiles(username, display_name, avatar_url)'

// รีวิวของผู้เยี่ยมชมไม่มี user_id ผูกไว้ จึงจำ id ไว้ในเครื่องเพื่อให้ยังลบของตัวเองได้
const GUEST_REVIEWS_KEY = 'prompt_library_my_review_ids'

function getGuestReviewIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(GUEST_REVIEWS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function addGuestReviewId(id: string) {
  try {
    localStorage.setItem(GUEST_REVIEWS_KEY, JSON.stringify([...getGuestReviewIds(), id]))
  } catch {
    // เขียนไม่ได้ก็ปล่อยไป แค่จะลบรีวิวตัวเองไม่ได้หลังรีเฟรช
  }
}

export default function ReviewSection({ promptId }: { promptId: string }) {
  const supabase = createClient()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [guestReviewIds, setGuestReviewIds] = useState<string[]>([])

  const [rating, setRating] = useState(0)
  const [guestName, setGuestName] = useState('')
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // แก้ไขรีวิว
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [editAnonymous, setEditAnonymous] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const [askDeleteId, setAskDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setGuestReviewIds(getGuestReviewIds())
    supabase.auth
      .getUser()
      .then((res: { data: { user: { id: string } | null } }) => setUserId(res.data.user?.id ?? null))
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select(SELECT_COLUMNS)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })

    setReviews((data as unknown as Review[]) ?? [])
    setLoading(false)
  }

  function canManage(review: Review) {
    if (review.user_id) return review.user_id === userId
    return guestReviewIds.includes(review.review_id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('กรุณาให้คะแนนอย่างน้อย 1 ดาว')
      return
    }

    // ด่านจริงอยู่ที่ trigger ฝั่งฐานข้อมูล ตรงนี้ไว้บอกผู้ใช้ก่อนเสียเวลาส่ง
    const dirtyWord =
      checkProfanity(comment, { label: 'ข้อความรีวิว' }) ??
      checkProfanity(guestName, { label: 'ชื่อผู้เขียน', checkReserved: true })
    if (dirtyWord) {
      setError(dirtyWord)
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
          // คงเจ้าของไว้เสมอ เพื่อให้กลับมาแก้/ลบได้ แม้เลือกไม่ระบุตัวตน
          user_id: user?.id ?? null,
          guest_name: user ? null : guestName.trim() || 'ผู้เยี่ยมชม',
          is_anonymous: user ? anonymous : true,
          rating,
          comment: comment.trim() || null,
        })
        .select(SELECT_COLUMNS)
        .single()

      if (insertError) throw insertError

      if (!user) {
        addGuestReviewId(inserted.review_id)
        setGuestReviewIds((prev) => [...prev, inserted.review_id])
      }
      setReviews((prev) => [inserted as unknown as Review, ...prev])

      setRating(0)
      setComment('')
      setGuestName('')
      setAnonymous(false)
      showToast('ส่งรีวิวแล้ว')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(review: Review) {
    setEditingId(review.review_id)
    setEditRating(review.rating)
    setEditComment(review.comment ?? '')
    setEditAnonymous(review.is_anonymous)
  }

  async function saveEdit(reviewId: string) {
    if (editRating === 0) {
      showToast('กรุณาให้คะแนนอย่างน้อย 1 ดาว', 'error')
      return
    }

    const dirtyWord = checkProfanity(editComment, { label: 'ข้อความรีวิว' })
    if (dirtyWord) {
      showToast(dirtyWord, 'error')
      return
    }

    setSavingEdit(true)
    const { data, error: updateError } = await supabase
      .from('reviews')
      .update({
        rating: editRating,
        comment: editComment.trim() || null,
        is_anonymous: editAnonymous,
        updated_at: new Date().toISOString(),
      })
      .eq('review_id', reviewId)
      .select(SELECT_COLUMNS)
    setSavingEdit(false)

    if (updateError) {
      showToast(`แก้ไขไม่สำเร็จ: ${updateError.message}`, 'error')
      return
    }
    // RLS ที่ปฏิเสธจะคืน 0 แถวโดยไม่มี error ต้องเช็คจำนวนแถวเองเสมอ
    if (!data || data.length === 0) {
      showToast('แก้ไขไม่สำเร็จ: ไม่มีสิทธิ์แก้รีวิวนี้', 'error')
      return
    }

    setReviews((prev) =>
      prev.map((r) => (r.review_id === reviewId ? (data[0] as unknown as Review) : r))
    )
    setEditingId(null)
    showToast('แก้ไขรีวิวแล้ว')
  }

  async function handleDelete(reviewId: string) {
    setDeleting(true)
    const { data, error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('review_id', reviewId)
      .select('review_id')
    setDeleting(false)

    if (deleteError) {
      showToast(`ลบไม่สำเร็จ: ${deleteError.message}`, 'error')
      return
    }
    if (!data || data.length === 0) {
      showToast('ลบไม่สำเร็จ: ไม่มีสิทธิ์ลบรีวิวนี้', 'error')
      return
    }

    setReviews((prev) => prev.filter((r) => r.review_id !== reviewId))
    setAskDeleteId(null)
    showToast('ลบรีวิวแล้ว')
  }

  const inputClass =
    'w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

  return (
    <div className="mt-10 pt-8 border-t border-line">
      {/*
        ตัวเลขต้องอยู่ "นอก" h2 ที่มีคลาส section-title
        เพราะคลาสนั้นใช้ background-clip: text + color: transparent ซึ่ง mask ทุกอย่างที่อยู่ข้างใน
        ตัวเลขที่ซ้อนอยู่ในนั้นจะจางจนแทบมองไม่เห็น ไม่ว่าจะกำหนดสีให้มันเองหรือไม่ก็ตาม
      */}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="section-title text-2xl font-extrabold">รีวิว</h2>
        <span className="font-mono text-2xl font-bold text-accent">({reviews.length})</span>
      </div>

      {/* ฟอร์มให้คะแนน */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-line rounded-lg p-4 mb-6 space-y-3"
      >
        {error && (
          <div className="bg-accent2/10 border border-accent2/30 text-accent2 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <p className="text-xs font-mono text-muted mb-1.5">ให้คะแนน</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {!userId && (
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="ชื่อของคุณ (ถ้าไม่ระบุจะแสดงเป็น 'ผู้เยี่ยมชม')"
            className={inputClass}
            maxLength={50}
          />
        )}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="เขียนความคิดเห็นเกี่ยวกับ prompt นี้..."
          rows={3}
          className={`${inputClass} resize-none`}
        />

        {userId && (
          <label className="flex w-fit cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--accent)]"
            />
            <span className="text-sm text-ink-soft">
              โพสต์แบบไม่ระบุตัวตน{' '}
              <span className="font-mono text-xs text-faint">(ไม่แสดงชื่อเล่นและรูปโปรไฟล์)</span>
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg font-mono text-sm bg-accent/10 text-accent border border-accent/60 hover:bg-accent/20 hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-all disabled:opacity-50"
        >
          {submitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
      </form>

      {/* รายการรีวิว */}
      {loading && <p className="text-faint font-mono text-sm">กำลังโหลด...</p>}

      {!loading && reviews.length === 0 && (
        <p className="text-faint font-mono text-sm py-6 text-center">
          {'>'} ยังไม่มีรีวิว เป็นคนแรกที่ให้คะแนน prompt นี้สิ
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => {
          const mine = canManage(review)
          const hidden = review.is_anonymous
          const name = hidden
            ? 'ไม่ระบุตัวตน'
            : review.profiles?.display_name?.trim() ||
              review.profiles?.username ||
              review.guest_name ||
              'ผู้เยี่ยมชม'
          const avatar = hidden ? null : review.profiles?.avatar_url
          const editing = editingId === review.review_id
          // กดดูโปรไฟล์ได้เฉพาะคนที่ระบุตัวตน ผู้เยี่ยมชมกับคนที่ซ่อนตัวตนไม่มีโปรไฟล์ให้ดู
          const profileHref =
            !hidden && review.profiles?.username
              ? `/u/${encodeURIComponent(review.profiles.username)}`
              : null

          const avatarBox = (
            <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-line bg-base">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-accent/10 font-display text-xs font-extrabold text-accent">
                  {hidden ? '?' : name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )

          return (
            <div key={review.review_id} className="bg-surface border border-line rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  {profileHref ? (
                    <Link href={profileHref} className="transition-opacity hover:opacity-80">
                      {avatarBox}
                    </Link>
                  ) : (
                    avatarBox
                  )}

                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {profileHref ? (
                        <Link
                          href={profileHref}
                          className="text-sm font-medium text-ink transition-colors hover:text-accent"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-ink">{name}</span>
                      )}
                      {mine && (
                        <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                          คุณ
                        </span>
                      )}
                      {mine && hidden && (
                        <span className="font-mono text-[10px] text-faint">ซ่อนตัวตนอยู่</span>
                      )}
                    </div>
                    {!editing && <StarRating value={review.rating} readOnly size={14} />}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs text-faint">
                    {new Date(review.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                  </span>
                  {mine && !editing && (
                    <>
                      <button
                        onClick={() => startEdit(review)}
                        className="font-mono text-xs text-accent hover:text-accent-soft"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setAskDeleteId(review.review_id)}
                        className="font-mono text-xs text-accent2 hover:opacity-80"
                      >
                        ลบ
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <div className="mt-3 space-y-3">
                  <StarRating value={editRating} onChange={setEditRating} />
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="เขียนความคิดเห็น..."
                  />
                  {review.user_id && (
                    <label className="flex w-fit cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={editAnonymous}
                        onChange={(e) => setEditAnonymous(e.target.checked)}
                        className="h-4 w-4 accent-[color:var(--accent)]"
                      />
                      <span className="text-sm text-ink-soft">โพสต์แบบไม่ระบุตัวตน</span>
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(review.review_id)}
                      disabled={savingEdit}
                      className="rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-sm text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
                    >
                      {savingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-line px-4 py-2 font-mono text-sm text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                )
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={askDeleteId !== null}
        busy={deleting}
        title="ลบรีวิวนี้?"
        description="รีวิวจะถูกลบถาวรและคะแนนเฉลี่ยของ Prompt จะถูกคำนวณใหม่"
        confirmLabel="ลบรีวิว"
        onConfirm={() => askDeleteId && handleDelete(askDeleteId)}
        onCancel={() => setAskDeleteId(null)}
      />
    </div>
  )
}
