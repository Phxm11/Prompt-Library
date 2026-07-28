'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { showToast } from '@/app/components/Toast'

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
  const [askDelete, setAskDelete] = useState(false)
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
    setDeleting(true)
    const { error } = await supabase.from('prompts').delete().eq('prompt_id', promptId)

    if (error) {
      setDeleting(false)
      showToast(`ลบไม่สำเร็จ: ${error.message}`, 'error')
      return
    }

    showToast('ลบ Prompt แล้ว')
    router.push('/home')
    router.refresh()
  }

  // ยังไม่เช็คเสร็จ หรือไม่มีสิทธิ์ -> ไม่แสดงอะไรเลย
  if (!checked || !canManage) return null

  return (
    <div className="flex items-center gap-2 mb-4">
      <a
        href={`/prompts/${promptId}/edit`}
        className="px-3.5 py-1.5 rounded-lg text-xs font-mono bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-all flex items-center gap-1.5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
        </svg>
        แก้ไข
      </a>

      <button
        onClick={() => setAskDelete(true)}
        disabled={deleting}
        className="px-3.5 py-1.5 rounded-lg text-xs font-mono border transition-all disabled:opacity-50 flex items-center gap-1.5 bg-accent2/10 text-accent2 border-accent2/30 hover:bg-accent2/20"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
        </svg>
        ลบ Prompt
      </button>

      <ConfirmDialog
        open={askDelete}
        busy={deleting}
        title="ลบ Prompt นี้?"
        description="Prompt จะถูกลบถาวร พร้อมรีวิวและรายการโปรดที่ผูกอยู่ กู้คืนไม่ได้"
        confirmLabel="ลบถาวร"
        onConfirm={handleDelete}
        onCancel={() => setAskDelete(false)}
      />
    </div>
  )
}
