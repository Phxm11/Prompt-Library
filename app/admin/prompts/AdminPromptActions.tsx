'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { showToast } from '@/app/components/Toast'

export default function AdminPromptActions({
  promptId,
  title,
}: {
  promptId: string
  title?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [askDelete, setAskDelete] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('prompts').delete().eq('prompt_id', promptId)
    setDeleting(false)

    if (error) {
      showToast(`ลบไม่สำเร็จ: ${error.message}`, 'error')
      return
    }

    setAskDelete(false)
    showToast('ลบ Prompt แล้ว')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/prompts/${promptId}/edit`}
        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-all"
      >
        แก้ไข
      </a>
      <button
        onClick={() => setAskDelete(true)}
        disabled={deleting}
        className="px-3 py-1.5 rounded-lg text-xs font-mono bg-accent2/10 text-accent2 border border-accent2/30 hover:bg-accent2/20 transition-all disabled:opacity-50"
      >
        ลบ
      </button>

      <ConfirmDialog
        open={askDelete}
        busy={deleting}
        title="ลบ Prompt นี้?"
        description={
          title
            ? `"${title}" จะถูกลบถาวร พร้อมรีวิวและรายการโปรดที่ผูกอยู่ กู้คืนไม่ได้`
            : 'Prompt จะถูกลบถาวร พร้อมรีวิวและรายการโปรดที่ผูกอยู่ กู้คืนไม่ได้'
        }
        confirmLabel="ลบถาวร"
        onConfirm={handleDelete}
        onCancel={() => setAskDelete(false)}
      />
    </div>
  )
}
