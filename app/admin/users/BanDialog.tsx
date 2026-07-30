'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** ปุ่มลัดสำหรับค่าที่ใช้บ่อย กดแล้วไปเติมในช่องกรอก ยังพิมพ์แก้เองได้ */
const PRESETS = [1, 3, 7, 14, 30, 90]

/** เพดาน 10 ปี ต้องตรงกับที่ ban_user ในฐานข้อมูลตรวจ */
const MAX_DAYS = 3650

/**
 * กล่องยืนยันแบน — เลือกจำนวนวันหรือถาวร พร้อมเหตุผล
 *
 * แยกจาก ConfirmDialog เพราะอันนั้นรับ input ได้ช่องเดียว
 * ส่วนอันนี้ต้องเลือกระยะเวลาด้วย และเหตุผลควรเป็นกล่องหลายบรรทัด
 */
export default function BanDialog({
  open,
  busy,
  who,
  onConfirm,
  onCancel,
}: {
  open: boolean
  busy: boolean
  who: string
  /** days = null คือแบนถาวร */
  onConfirm: (input: { days: number | null; reason: string }) => void
  onCancel: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [permanent, setPermanent] = useState(false)
  const [days, setDays] = useState('7')
  const [reason, setReason] = useState('')

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onCancel])

  if (!mounted || !open) return null

  const parsedDays = Number.parseInt(days, 10)
  const daysValid = Number.isInteger(parsedDays) && parsedDays >= 1 && parsedDays <= MAX_DAYS
  const canSubmit = permanent || daysValid

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`แบน ${who}`}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <button
        aria-label="ยกเลิก"
        onClick={onCancel}
        className="animate-fade-soft absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
      />

      <div className="animate-dialog-in relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <h2 className="text-lg font-bold text-ink">แบน {who}?</h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          ระหว่างโดนแบนจะโพสต์ prompt เขียนรีวิว กดถูกใจ หรือแก้โปรไฟล์ไม่ได้ แต่ยังเข้ามาดูเว็บได้ตามปกติ
        </p>

        <div className="mt-5">
          <span className="mb-1.5 block text-xs font-mono text-muted">ระยะเวลา</span>

          {/* สองโหมด: กำหนดวันเอง กับ ถาวร */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPermanent(false)}
              className={`flex-1 rounded-lg border px-3 py-2 font-mono text-xs transition-colors ${
                permanent
                  ? 'border-line text-muted hover:border-accent/50 hover:text-accent'
                  : 'border-accent/60 bg-accent/10 text-accent'
              }`}
            >
              กำหนดจำนวนวัน
            </button>
            <button
              type="button"
              onClick={() => setPermanent(true)}
              className={`flex-1 rounded-lg border px-3 py-2 font-mono text-xs transition-colors ${
                permanent
                  ? 'border-accent2/60 bg-accent2/10 text-accent2'
                  : 'border-line text-muted hover:border-accent2/50 hover:text-accent2'
              }`}
            >
              ถาวร
            </button>
          </div>

          {permanent ? (
            <p className="mt-2 font-mono text-[11px] text-faint">
              แบนถาวร ต้องให้แอดมินปลดเองเท่านั้น
            </p>
          ) : (
            <>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={MAX_DAYS}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  aria-label="จำนวนวันที่แบน"
                  className="w-28 rounded-lg border border-line bg-base px-3.5 py-2.5 font-mono text-sm text-ink transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
                />
                <span className="font-mono text-sm text-muted">วัน</span>
              </div>

              {/* ปุ่มลัด กดแล้วเติมค่าให้ ยังพิมพ์แก้เองได้ */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDays(String(preset))}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      parsedDays === preset
                        ? 'border-accent/60 bg-accent/10 text-accent'
                        : 'border-line text-muted hover:border-accent/50 hover:text-accent'
                    }`}
                  >
                    {preset} วัน
                  </button>
                ))}
              </div>

              <p
                className={`mt-2 font-mono text-[11px] ${daysValid ? 'text-faint' : 'text-accent2'}`}
              >
                {daysValid
                  ? `ครบ ${parsedDays} วันแล้วปลดให้อัตโนมัติ`
                  : `กรอกเป็นจำนวนเต็ม 1-${MAX_DAYS} วัน`}
              </p>
            </>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="ban-reason" className="mb-1.5 block text-xs font-mono text-muted">
            เหตุผล (ผู้ใช้จะเห็นข้อความนี้)
          </label>
          <textarea
            id="ban-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="เช่น โพสต์เนื้อหาไม่เหมาะสมซ้ำหลายครั้ง"
            className="w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={() =>
              onConfirm({ days: permanent ? null : parsedDays, reason: reason.trim() })
            }
            disabled={busy || !canSubmit}
            className="rounded-lg border border-accent2/60 bg-accent2/15 px-5 py-2.5 font-mono text-sm text-accent2 transition-all hover:bg-accent2/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'กำลังแบน...' : permanent ? 'แบนถาวร' : `แบน ${daysValid ? parsedDays : '—'} วัน`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
