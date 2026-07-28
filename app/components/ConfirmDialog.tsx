'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  /** ถ้าใส่ จะมีช่องกรอกข้อความ แล้วส่งค่าที่กรอกกลับไปตอนกดยืนยัน */
  inputLabel?: string
  inputPlaceholder?: string
  confirmLabel?: string
  cancelLabel?: string
  /** danger = การกระทำที่ย้อนกลับไม่ได้ ใช้โทนชมพูเพื่อให้สะดุด */
  tone?: 'danger' | 'normal'
  busy?: boolean
  onConfirm: (inputValue: string) => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  inputLabel,
  inputPlaceholder,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [value, setValue] = useState('')
  const [mounted, setMounted] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  // portal ใช้ได้เฉพาะฝั่ง client เท่านั้น
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    setValue('')

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)

    // กันหน้าเลื่อนตอน dialog เปิด
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // โฟกัสปุ่มยืนยันเพื่อให้กด Enter ได้เลย และ Tab ไม่หลุดไปหลังฉาก
    requestAnimationFrame(() => confirmRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onCancel])

  if (!mounted || !open) return null

  const accentClass =
    tone === 'danger'
      ? 'border-accent2/60 bg-accent2/15 text-accent2 hover:bg-accent2/25'
      : 'border-accent/60 bg-accent/15 text-accent hover:bg-accent/25'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <button
        aria-label={cancelLabel}
        onClick={onCancel}
        className="animate-fade-soft absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
      />

      <div className="animate-dialog-in relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>}

        {inputLabel && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-mono text-muted">{inputLabel}</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={() => onConfirm(value)}
            disabled={busy}
            className={`rounded-lg border px-5 py-2.5 font-mono text-sm transition-all disabled:opacity-50 ${accentClass}`}
          >
            {busy ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
