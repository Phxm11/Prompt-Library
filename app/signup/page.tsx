'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FacebookLoginButton from '@/app/components/FacebookLoginButton'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setSubmitting(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    setEmailSent(true)
    setSubmitting(false)
  }

  const inputClass =
    'w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

  if (emailSent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <path d="M4 4h16v16H4z" />
              <path d="m22 6-10 7L2 6" />
            </svg>
          </div>
          <h1 className="section-title section-title-center text-xl font-extrabold mb-2">ตรวจสอบอีเมลของคุณ</h1>
          <p className="text-sm text-muted">
            เราส่งลิงก์ยืนยันไปที่ <span className="text-accent">{email}</span> แล้ว
            กรุณากดยืนยันก่อนเข้าสู่ระบบ
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="section-title text-2xl font-extrabold text-ink mb-6">
          สมัครสมาชิก
        </h1>

        <FacebookLoginButton />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-faint font-mono">หรือ</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-accent2/10 border border-accent2/30 text-accent2 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-muted mb-1.5 block">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted mb-1.5 block">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted mb-1.5 block">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-mono text-sm bg-accent/10 text-accent border border-accent/60 hover:bg-accent/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
          >
            {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          มีบัญชีอยู่แล้ว?{' '}
          <a href="/login" className="text-accent hover:text-accent">
            เข้าสู่ระบบ
          </a>
        </p>
      </div>
    </div>
  )
}