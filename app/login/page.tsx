'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FacebookLoginButton from '@/app/components/FacebookLoginButton'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : signInError.message
      )
      setSubmitting(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const inputClass =
    'w-full bg-[#12121c] border border-[#232336] rounded-lg px-3.5 py-2.5 text-sm text-[#f2f2f7] placeholder:text-[#666680] focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
          // login
        </p>
        <h1
          className="text-2xl font-bold text-[#f2f2f7] mb-6"
        >
          เข้าสู่ระบบ
        </h1>

        <FacebookLoginButton />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#232336]" />
          <span className="text-xs text-[#666680] font-mono">หรือ</span>
          <div className="flex-1 h-px bg-[#232336]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-[#8888a0] mb-1.5 block">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#8888a0] mb-1.5 block">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-mono text-sm bg-cyan-500/10 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
          >
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-sm text-[#8888a0] mt-6 text-center">
          ยังไม่มีบัญชี?{' '}
          <a href="/signup" className="text-cyan-400 hover:text-cyan-300">
            สมัครสมาชิก
          </a>
        </p>
      </div>
    </div>
  )
}