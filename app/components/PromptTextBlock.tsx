'use client'

import { useRef, useState, useLayoutEffect } from 'react'

// prompt บางอันยาวมาก (หลายย่อหน้า) ถ้าปล่อยให้กล่องยืดตามเนื้อหาเฉย ๆ
// จะดันปุ่มคัดลอก/รีวิวลงไปไกลเกินจอ เลยจำกัดความสูงไว้ก่อน แล้วให้กดดูเพิ่มเติมเอา
const COLLAPSED_HEIGHT = 220 // px

export default function PromptTextBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (el) setOverflowing(el.scrollHeight > COLLAPSED_HEIGHT + 8)
  }, [text])

  return (
    <div className="relative">
      <p
        ref={contentRef}
        className="text-ink-soft whitespace-pre-wrap text-sm leading-relaxed overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: expanded ? contentRef.current?.scrollHeight ?? 'none' : COLLAPSED_HEIGHT }}
      >
        {text}
      </p>

      {overflowing && !expanded && (
        // ไล่โทนจางด้านล่าง บอกเป็นนัยว่ายังมีข้อความต่อ ก่อนถึงปุ่ม
        <div className="pointer-events-none absolute inset-x-0 bottom-8 h-12 bg-gradient-to-t from-surface to-transparent" />
      )}

      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-mono text-accent hover:text-accent-soft transition-colors"
        >
          {expanded ? '▲ ย่อข้อความ' : '▼ ดูเพิ่มเติม'}
        </button>
      )}
    </div>
  )
}
