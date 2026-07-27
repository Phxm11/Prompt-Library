'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import type { User } from '@supabase/supabase-js'

type CopyPromptButtonProps = {
  promptId: string
  promptText: string
  initialCopyCount?: number
}

export default function CopyPromptButton({
  promptId,
  promptText,
  initialCopyCount = 0,
}: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false)
  const [copyCount, setCopyCount] = useState(initialCopyCount)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setIsLoggedIn(Boolean(user))
    })
  }, [supabase])

  async function handleCopy() {
    // ยังไม่ login -> พาไปหน้า login แทนการคัดลอก
    if (!isLoggedIn) {
      router.push(`/login?next=/prompts/${promptId}`)
      return
    }

    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      showToast('คัดลอก Prompt แล้ว')
      setTimeout(() => setCopied(false), 2000)

      setCopyCount((prev) => prev + 1)

      await supabase.rpc('increment_copy_count', { prompt_id_input: promptId })

      const { data } = await supabase.auth.getUser()
      const user: User | null = data.user

      await supabase.from('usage_history').insert({
        prompt_id: promptId,
        user_id: user?.id ?? null,
        action_type: 'copy',
      })

      router.refresh()
    } catch (err) {
      console.error('Copy failed:', err)
      showToast('คัดลอกไม่สำเร็จ ลองใหม่อีกครั้ง', 'error')
      setCopyCount((prev) => Math.max(prev - 1, 0))
    }
  }

  const locked = isLoggedIn === false

  return (
    <div>
      <button
        onClick={handleCopy}
        className={`group w-full py-3 rounded-lg font-mono text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
          copied
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            : locked
            ? 'bg-surface text-muted border-line hover:border-accent/40 hover:text-accent'
            : 'bg-accent/10 text-accent border-accent/60 hover:bg-accent/20 hover:border-accent hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]'
        }`}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            คัดลอกแล้ว
          </>
        ) : locked ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            เข้าสู่ระบบเพื่อคัดลอก
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="group-hover:scale-110 transition-transform"
            >
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            คัดลอก Prompt
          </>
        )}
      </button>

      <p className="text-center text-xs text-faint font-mono mt-2">
        📋 ถูกคัดลอกไปแล้ว {copyCount} ครั้ง
      </p>
    </div>
  )
}