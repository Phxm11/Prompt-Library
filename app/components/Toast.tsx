'use client'

import { useEffect, useState } from 'react'

type ToastItem = { id: number; message: string; tone: 'ok' | 'error' }

let nextId = 1
const listeners = new Set<(toast: ToastItem) => void>()

// อยู่นอก component เพื่อให้เรียกจากที่ไหนก็ได้ฝั่ง client โดยไม่ต้องส่ง prop ลงไปเป็นทอด ๆ
export function showToast(message: string, tone: ToastItem['tone'] = 'ok') {
  const toast: ToastItem = { id: nextId++, message, tone }
  listeners.forEach((listener) => listener(toast))
}

// ข้อความ error มักยาวและต้องอ่านทัน จึงค้างนานกว่าข้อความสำเร็จ
const VISIBLE_MS = { ok: 2400, error: 8000 }

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    function handle(toast: ToastItem) {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, VISIBLE_MS[toast.tone])
    }

    listeners.add(handle)
    return () => {
      listeners.delete(handle)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-toast-in flex max-w-[90vw] items-start gap-2.5 rounded-xl border px-4 py-3 text-left font-mono text-sm backdrop-blur sm:max-w-xl ${
            toast.tone === 'ok'
              ? 'border-accent/60 bg-surface/95 text-accent-soft shadow-[0_12px_40px_-10px_rgba(0,229,255,0.55)]'
              : 'border-accent2/60 bg-surface/95 text-accent2 shadow-[0_12px_40px_-10px_rgba(255,62,200,0.5)]'
          }`}
        >
          {toast.tone === 'ok' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )}
          <span className="min-w-0 break-words">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
