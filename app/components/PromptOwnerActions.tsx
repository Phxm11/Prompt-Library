'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PromptOwnerActions({
  promptId,
  ownerId,
}: {
  promptId: string
  ownerId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()

  const [canManage, setCanManage] = useState(false)
  const [checked, setChecked] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setChecked(true)
        return
      }

      const isOwner = user.id === ownerId

      let isAdmin = false
      if (!isOwner) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        isAdmin = profile?.role === 'admin'
      }

      if (!cancelled) {
        setCanManage(isOwner || isAdmin)
        setChecked(true)
      }
    }

    check()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptId, ownerId])

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    setDeleting(true)
    const { error } = await supabase.from('prompts').delete().eq('prompt_id', promptId)

    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message)
      setDeleting(false)
      setConfirming(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  // ยังไม่เช็คเสร็จ หรือไม่มีสิทธิ์ -> ไม่แสดงอะไรเลย
  if (!checked || !canManage) return null

  return (
    <div className="flex items-center gap-2 mb-4">
      <a
        href={`/prompts/${promptId}/edit`}
        className="px-3.5 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
        </svg>
        แก้ไข
      </a>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono border transition-all disabled:opacity-50 flex items-center gap-1.5 ${
          confirming
            ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400'
            : 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/20'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
        </svg>
        {deleting ? 'กำลังลบ...' : confirming ? 'ยืนยันลบ Prompt นี้?' : 'ลบ Prompt'}
      </button>
    </div>
  )
}