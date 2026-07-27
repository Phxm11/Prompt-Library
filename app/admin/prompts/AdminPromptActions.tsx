'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminPromptActions({ promptId }: { promptId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000) // ยกเลิกโหมดยืนยันถ้าไม่กดซ้ำใน 3 วิ
      return
    }

    setDeleting(true)
    const { error } = await supabase.from('prompts').delete().eq('prompt_id', promptId)
    if (!error) {
      router.refresh()
    } else {
      alert('ลบไม่สำเร็จ: ' + error.message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/prompts/${promptId}/edit`}
        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
      >
        แก้ไข
      </a>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all disabled:opacity-50 ${
          confirming
            ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400'
            : 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/20'
        }`}
      >
        {deleting ? 'กำลังลบ...' : confirming ? 'ยืนยันลบ?' : 'ลบ'}
      </button>
    </div>
  )
}