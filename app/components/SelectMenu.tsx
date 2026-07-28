'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/app/components/Icon'

export type SelectOption = { value: string; label: string }

type SelectMenuProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** ข้อความตอนยังไม่ได้เลือก (ค่าที่ส่งกลับคือสตริงว่าง) */
  placeholder?: string
  ariaLabel?: string
  className?: string
}

const GAP = 8
const MAX_PANEL_HEIGHT = 288

export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className = '',
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; flip: boolean } | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => setMounted(true), [])

  // รวมตัวเลือก "ทั้งหมด" (ค่าว่าง) เข้าไปเป็นรายการแรก ถ้ามี placeholder
  const items: SelectOption[] = placeholder
    ? [{ value: '', label: placeholder }, ...options]
    : options

  const selected = items.find((o) => o.value === value)

  /*
    วางเมนูด้วยพิกัดจริงบนจอแล้วส่งไปแขวนที่ document.body ผ่าน portal

    เดิมใช้ absolute ซ้อนในตัว component ซึ่งพังสองแบบ:
    1) element แม่ที่มี transform (เช่นอนิเมชันตอนโผล่) สร้าง stacking context ใหม่
       ทำให้ z-index ของเมนูสู้พี่น้องที่อยู่ถัดไปไม่ได้ เมนูเลยมุดลงไปอยู่ใต้ช่องอื่น
    2) กล่องที่ตั้ง overflow-hidden ไว้ (เช่นการ์ดตารางในหน้า admin) จะตัดเมนูหายไปเลย
  */
  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return

    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const needed = Math.min(items.length * 40 + 8, MAX_PANEL_HEIGHT)
    // ถ้าข้างล่างไม่พอและข้างบนกว้างกว่า ให้พลิกไปกางขึ้น
    const flip = spaceBelow < needed + GAP && r.top > spaceBelow

    setRect({
      top: flip ? r.top - GAP : r.bottom + GAP,
      left: r.left,
      width: r.width,
      flip,
    })
  }, [items.length])

  useLayoutEffect(() => {
    if (!open) return
    place()
  }, [open, place])

  useEffect(() => {
    if (!open) return

    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    // ตำแหน่งต้องตามไปด้วยเวลาหน้าเลื่อนหรือย่อ-ขยาย เพราะเมนูใช้พิกัดคงที่บนจอ
    function onReflow() {
      place()
    }

    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [open, place])

  // เปิดมาให้ไฮไลต์อยู่ที่ตัวที่เลือกไว้ และเลื่อนให้เห็น
  useEffect(() => {
    if (!open) return
    const current = Math.max(items.findIndex((o) => o.value === value), 0)
    setActiveIndex(current)
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll('li')[current]?.scrollIntoView({ block: 'nearest' })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function pick(v: string) {
    onChange(v)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }

    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setOpen(true)
      return
    }

    if (!open) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      const next = (activeIndex + step + items.length) % items.length
      setActiveIndex(next)
      listRef.current?.querySelectorAll('li')[next]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(items[activeIndex].value)
    }
  }

  const panel = open && rect && (
    <ul
      ref={listRef}
      role="listbox"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        maxHeight: MAX_PANEL_HEIGHT,
        transform: rect.flip ? 'translateY(-100%)' : undefined,
      }}
      className="animate-menu-in z-[150] min-w-max overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]"
    >
      {items.map((opt, i) => {
        const isSelected = opt.value === value
        return (
          <li key={opt.value || '__all__'}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => pick(opt.value)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left font-mono text-sm transition-colors ${
                isSelected
                  ? 'bg-accent/10 text-accent'
                  : i === activeIndex
                  ? 'bg-accent/5 text-ink'
                  : 'text-ink-soft'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="shrink-0"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3.5 py-2 font-mono text-sm transition-all ${
          open
            ? 'border-accent text-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]'
            : 'border-line text-ink-soft hover:border-accent/50 hover:text-accent'
        }`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <span className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <Icon name="chevron-down" size={14} />
        </span>
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  )
}
