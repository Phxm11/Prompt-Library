'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FacebookLoginButton() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleFacebookLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Facebook login failed:', error)
      setLoading(false)
    }
    // ถ้าสำเร็จ Supabase จะ redirect ไปหน้า Facebook เองอัตโนมัติ ไม่ต้องทำอะไรต่อ
  }

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={loading}
      className="w-full py-3 rounded-lg font-mono text-sm font-medium border transition-all flex items-center justify-center gap-2.5 bg-surface text-ink-soft border-line hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10 hover:text-[#4a9eff] disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
      {loading ? 'กำลังเชื่อมต่อ...' : 'ดำเนินการต่อด้วย Facebook'}
    </button>
  )
}