'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 className="section-title section-title-center text-2xl font-extrabold text-accent2 mb-4">
          เกิดข้อผิดพลาด
        </h2>

        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent2/10 border border-accent2/30 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff3ec8"
            strokeWidth="2"
          >
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>

        <h1
          className="section-title section-title-center text-xl font-extrabold mb-2"
        >
          เกิดข้อผิดพลาดบางอย่าง
        </h1>
        <p className="text-sm text-muted mb-6">
          ขออภัยในความไม่สะดวก ลองรีเฟรชหน้านี้อีกครั้ง หรือกลับไปหน้าหลัก
        </p>

        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-left font-mono text-accent2 bg-accent2/5 border border-accent2/20 rounded-lg p-3 mb-6 overflow-auto max-h-32">
            {error.message}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg font-mono text-sm bg-accent/10 text-accent border border-accent/60 hover:bg-accent/20 hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-all"
          >
            ลองใหม่
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-lg font-mono text-sm bg-surface text-ink-soft border border-line hover:border-accent/40 transition-all"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  )
}