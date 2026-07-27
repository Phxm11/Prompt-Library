'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('ลบรีวิวนี้?')) return
    setDeleting(true)
    const { error } = await supabase.from('reviews').delete().eq('review_id', reviewId)
    if (!error) {
      router.refresh()
    } else {
      alert('ลบไม่สำเร็จ: ' + error.message)
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20 transition-all disabled:opacity-50"
    >
      {deleting ? 'กำลังลบ...' : 'ลบรีวิว'}
    </button>
  )
}