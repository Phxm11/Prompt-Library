'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'

type Provider = 'facebook' | 'google'

const CONFIG: Record<Provider, { label: string; hoverClass: string; icon: React.ReactNode }> = {
  facebook: {
    label: 'ดำเนินการต่อด้วย Facebook',
    hoverClass: 'hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10 hover:text-[#1877F2]',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  google: {
    label: 'ดำเนินการต่อด้วย Google',
    hoverClass: 'hover:border-[#EA4335]/50 hover:bg-[#EA4335]/8 hover:text-[#EA4335]',
    // โลโก้ Google ต้องคงสี่สีตามไกด์ไลน์ของแบรนด์ ย้อมเป็นสีเดียวไม่ได้
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.75 12 4.75z"
        />
      </svg>
    ),
  },
}

export default function OAuthLoginButton({
  provider,
  next,
}: {
  provider: Provider
  /** หน้าที่จะพากลับไปหลังล็อกอินเสร็จ */
  next?: string
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const config = CONFIG[provider]

  async function handleLogin() {
    setLoading(true)

    // ส่ง next ต่อไปให้ /auth/callback เพื่อพากลับไปหน้าที่ผู้ใช้ค้างไว้
    const callback = new URL('/auth/callback', window.location.origin)
    if (next) callback.searchParams.set('next', next)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    })

    if (error) {
      console.error(`[auth] ${provider} login failed: ${error.message}`)
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${error.message}`, 'error')
      setLoading(false)
    }
    // ถ้าสำเร็จ Supabase จะพาไปหน้าของผู้ให้บริการเองอัตโนมัติ
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={loading}
      className={`w-full py-3 rounded-lg font-mono text-sm font-medium border border-line bg-surface text-ink-soft transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 ${config.hoverClass}`}
    >
      {config.icon}
      {loading ? 'กำลังเชื่อมต่อ...' : config.label}
    </button>
  )
}
