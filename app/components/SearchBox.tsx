'use client'

import { useEffect, useId, useRef, useState } from 'react'

export type Suggestion = {
  id: string
  label: string
  /** ข้อความรองใต้ label เช่น @username หรือหมวดหมู่ */
  hint?: string
  /** รูปกลมหน้ารายการ ใช้กับรายการที่เป็นคน จะได้แยกออกจากรายการอื่นตั้งแต่แรกเห็น */
  avatarUrl?: string | null
}

const DEBOUNCE_MS = 250
const MIN_CHARS = 1

/**
 * ช่องค้นหาพร้อมรายการแนะนำ
 *
 * ดึงรายการแนะนำผ่าน fetchSuggestions ที่ผู้เรียกส่งเข้ามา
 * ตัว component จึงไม่ผูกกับตารางไหนเป็นพิเศษ ใช้ได้ทั้งหน้า prompt และหน้าผู้ใช้
 */
export default function SearchBox({
  value,
  placeholder,
  onSearch,
  onPick,
  fetchSuggestions,
  className = 'w-60',
}: {
  value: string
  placeholder?: string
  onSearch: (keyword: string) => void
  /** ถ้าส่งมา การเลือกรายการแนะนำจะเรียกอันนี้แทน onSearch เช่นให้เด้งไปหน้ารายการนั้นเลย */
  onPick?: (item: Suggestion) => void
  fetchSuggestions: (keyword: string) => Promise<Suggestion[]>
  className?: string
}) {
  const [keyword, setKeyword] = useState(value)
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)

  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  // นับรอบการค้นไว้กันผลลัพธ์เก่ามาทับผลใหม่ เวลาพิมพ์เร็วแล้ว response สลับลำดับกัน
  const runIdRef = useRef(0)

  // ล้างรายการตอนพิมพ์สั้นเกินทำที่นี่ ไม่ทำใน effect เพราะ setState ตรง ๆ ใน effect ทำให้ render ซ้อน
  function handleChange(next: string) {
    setKeyword(next)
    if (next.trim().length < MIN_CHARS) {
      setItems([])
      setOpen(false)
    }
  }

  useEffect(() => {
    const kw = keyword.trim()
    if (kw.length < MIN_CHARS) return

    const runId = ++runIdRef.current

    // ตั้งสถานะกำลังโหลดหลังหมดเวลา debounce ระหว่างพิมพ์รัว ๆ จะได้ไม่กะพริบ
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const found = await fetchSuggestions(kw)
        if (runId !== runIdRef.current) return // มีการพิมพ์ใหม่แล้ว ทิ้งผลนี้
        setItems(found)
        setOpen(found.length > 0)
        setActiveIndex(-1)
      } finally {
        if (runId === runIdRef.current) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function submit(kw: string) {
    setOpen(false)
    onSearch(kw.trim())
  }

  function pick(item: Suggestion) {
    setKeyword(item.label)
    setOpen(false)
    if (onPick) onPick(item)
    else onSearch(item.label.trim())
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (items.length === 0) return
      e.preventDefault()
      setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((prev) => (prev + step + items.length) % items.length)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // ถ้ากำลังเลือกรายการแนะนำอยู่ ให้ใช้รายการนั้น ไม่งั้นค้นด้วยคำที่พิมพ์เอง
      const active = activeIndex >= 0 ? items[activeIndex] : undefined
      if (active) pick(active)
      else submit(keyword)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      <input
        type="text"
        value={keyword}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => items.length > 0 && setOpen(true)}
        placeholder={placeholder}
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-autocomplete="list"
        className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-8 font-mono text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none"
      />

      {keyword && (
        <button
          type="button"
          onClick={() => {
            setKeyword('')
            setItems([])
            setOpen(false)
            onSearch('')
          }}
          aria-label="ล้างคำค้นหา"
          className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-faint hover:text-accent2"
        >
          ✕
        </button>
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="animate-menu-in absolute left-0 top-full z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]"
        >
          {loading && (
            <li className="px-3 py-2 font-mono text-xs text-faint">กำลังค้นหา...</li>
          )}
          {items.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(item)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  i === activeIndex ? 'bg-accent/10 text-accent' : 'text-ink-soft'
                }`}
              >
                {/* มีรูป = เป็นคน ไม่มี = เป็นรายการอื่น รูปว่างก็ยังกันช่องไว้ให้แถวเรียงตรงกัน */}
                {item.avatarUrl !== undefined && (
                  <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-line bg-base">
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-accent/10 font-display text-xs font-extrabold text-accent">
                        {item.label.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block w-full truncate text-sm">{item.label}</span>
                  {item.hint && (
                    <span className="block w-full truncate font-mono text-[11px] text-faint">
                      {item.hint}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
