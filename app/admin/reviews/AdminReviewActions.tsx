'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { showToast } from '@/app/components/Toast'

export default function AdminReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [askDelete, setAskDelete] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('reviews').delete().eq('review_id', reviewId)
    setDeleting(false)

    if (error) {
      showToast(`ลบไม่สำเร็จ: ${error.message}`, 'error')
      return
    }

    setAskDelete(false)
    showToast('ลบรีวิวแล้ว')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setAskDelete(true)}
        disabled={deleting}
        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-accent2/10 text-accent2 border border-accent2/30 hover:bg-accent2/20 transition-all disabled:opacity-50"
      >
        ลบรีวิว
      </button>

      <ConfirmDialog
        open={askDelete}
        busy={deleting}
        title="ลบรีวิวนี้?"
        description="รีวิวจะถูกลบถาวรและคะแนนเฉลี่ยของ Prompt จะถูกคำนวณใหม่"
        confirmLabel="ลบรีวิว"
        onConfirm={handleDelete}
        onCancel={() => setAskDelete(false)}
      />
    </>
  )
}
