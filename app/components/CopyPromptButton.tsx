'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CopyPromptButtonProps = {
  promptId: string
  promptText: string
}

export default function CopyPromptButton({ promptId, promptText }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      // นับจำนวนครั้งที่ copy แบบ atomic ผ่าน Postgres function
      // ไม่ await ให้ error ไปกระทบ UX การ copy (fire and forget)
      supabase.rpc('increment_copy_count', { prompt_id_input: promptId })
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`group w-full py-3 rounded-lg font-mono text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
        copied
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
          : 'bg-cyan-500/10 text-cyan-300 border-cyan-400/60 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]'
      }`}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          คัดลอกแล้ว
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
  )
}