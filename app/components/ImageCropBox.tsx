'use client'

import { useRef, useState } from 'react'

export type CropValue = { position: string; zoom: number }

export const DEFAULT_CROP: CropValue = { position: '50% 50%', zoom: 1 }

const MIN_ZOOM = 1
const MAX_ZOOM = 3

/**
 * เลือกกรอบของรูปที่จะเอาไปโชว์ — ลากเพื่อขยับ, ซูมด้วยสไลเดอร์หรือลูกกลิ้งเมาส์
 *
 * ไม่ได้ครอปไฟล์จริง แต่เก็บเป็น "วิธีแสดงผล" (object-position + scale)
 * รูปต้นฉบับจึงไม่ถูกทำลาย กลับมาปรับใหม่ได้ตลอดโดยไม่เสียคุณภาพ
 * และหน้าอื่นเอาค่าเดียวกันนี้ไปวาดให้เหมือนกันได้ทันที
 */
export default function ImageCropBox({
  src,
  value,
  onChange,
  aspect = 'aspect-video',
  compact = false,
  round = false,
}: {
  src: string
  value: CropValue
  onChange: (next: CropValue) => void
  aspect?: string
  /** ย่อส่วนควบคุมลง ใช้กับรูปตัวอย่างที่มีหลายรูปเรียงกัน */
  compact?: boolean
  /** กรอบวงกลม ใช้กับรูปโปรไฟล์ที่แสดงผลเป็นวงกลม จะได้เห็นตรงกับของจริง */
  round?: boolean
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const [x, y] = parsePosition(value.position)
  const zoom = clampZoom(value.zoom)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const frame = frameRef.current
    if (!frame) return

    e.preventDefault()
    frame.setPointerCapture(e.pointerId)
    setDragging(true)

    let lastX = e.clientX
    let lastY = e.clientY
    let curX = x
    let curY = y

    function onMove(ev: PointerEvent) {
      const rect = frame!.getBoundingClientRect()
      // ยิ่งซูมเข้า การลากระยะเท่าเดิมควรเลื่อนรูปน้อยลง ไม่งั้นจะรู้สึกไวเกินคุม
      const speed = 100 / zoom
      curX = clamp(curX - ((ev.clientX - lastX) / rect.width) * speed)
      curY = clamp(curY - ((ev.clientY - lastY) / rect.height) * speed)
      lastX = ev.clientX
      lastY = ev.clientY
      onChange({ position: `${Math.round(curX)}% ${Math.round(curY)}%`, zoom })
    }

    function onUp(ev: PointerEvent) {
      frame!.releasePointerCapture(ev.pointerId)
      frame!.removeEventListener('pointermove', onMove)
      frame!.removeEventListener('pointerup', onUp)
      setDragging(false)
    }

    frame.addEventListener('pointermove', onMove)
    frame.addEventListener('pointerup', onUp)
  }

  function handleWheel(e: React.WheelEvent) {
    // ไม่ preventDefault เพราะ Chrome ถือว่า wheel เป็น passive listener
    const next = clampZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1))
    if (next !== zoom) onChange({ position: value.position, zoom: next })
  }

  const isDefault = value.position === DEFAULT_CROP.position && zoom === DEFAULT_CROP.zoom

  return (
    <div>
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        className={`relative ${aspect} w-full overflow-hidden ${round ? 'rounded-full' : 'rounded-lg'} border transition-colors ${
          dragging ? 'border-accent cursor-grabbing' : 'border-line cursor-grab hover:border-accent/50'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="ตัวอย่างกรอบรูป"
          draggable={false}
          style={{ objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` }}
          className="pointer-events-none h-full w-full select-none object-cover"
        />

        {/* เส้นแบ่งสามส่วนช่วยเล็ง โผล่ตอนลาก */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity ${
            dragging ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
        </div>

        {!dragging && !compact && (
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-[11px] text-white backdrop-blur">
            ลากเพื่อขยับ · เลื่อนลูกกลิ้งเพื่อซูม
          </span>
        )}
      </div>

      <div className={`mt-2 flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        <span className="font-mono text-faint">ซูม</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(e) =>
            onChange({ position: value.position, zoom: clampZoom(Number(e.target.value)) })
          }
          className="h-1 flex-1 cursor-pointer accent-[color:var(--accent)]"
        />
        <span className="w-10 shrink-0 text-right font-mono text-faint">{zoom.toFixed(2)}x</span>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CROP)}
            className="shrink-0 font-mono text-accent hover:text-accent-soft"
          >
            รีเซ็ต
          </button>
        )}
      </div>
    </div>
  )
}

function parsePosition(value: string): [number, number] {
  const parts = (value ?? '').split(/\s+/)
  const x = Number.parseFloat(parts[0])
  const y = Number.parseFloat(parts[1])
  return [Number.isFinite(x) ? x : 50, Number.isFinite(y) ? y : 50]
}

function clamp(n: number) {
  return Math.min(100, Math.max(0, n))
}

function clampZoom(n: number) {
  if (!Number.isFinite(n)) return 1
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(n * 100) / 100))
}
