'use client'

import { useState, ViewTransition } from 'react'

type ImageGalleryProps = {
  coverImageUrl: string | null
  examples: { example_id: string; file_url: string }[]
  title: string
  /** ชื่อ view transition ให้ตรงกับรูปบนการ์ด รูปจะได้มอร์ฟต่อกันตอนเปลี่ยนหน้า */
  transitionName?: string
}

export default function ImageGallery({
  coverImageUrl,
  examples,
  title,
  transitionName,
}: ImageGalleryProps) {
  // รวมภาพหลักกับภาพตัวอย่างเข้าด้วยกัน (ตัดรูปซ้ำออก)
  const allImages = [
    ...(coverImageUrl ? [coverImageUrl] : []),
    ...examples.map((e) => e.file_url),
  ]

  const [activeImage, setActiveImage] = useState(allImages[0] ?? null)

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-surface border border-line rounded-xl flex items-center justify-center text-faint font-mono text-sm">
        no_preview.img
      </div>
    )
  }

  return (
    <div>
      {/* ภาพหลัก */}
      <div className="relative aspect-video bg-surface border border-line rounded-xl overflow-hidden mb-3">
        <ViewTransition name={transitionName}>
          <img
            src={activeImage ?? allImages[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        </ViewTransition>

        {/* กรอบ HUD ที่มุมภาพ ค่อย ๆ ติดขึ้นมา */}
        <span className="animate-fade-soft [animation-delay:520ms] pointer-events-none absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/70" />
        <span className="animate-fade-soft [animation-delay:600ms] pointer-events-none absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/70" />
        <span className="animate-fade-soft [animation-delay:680ms] pointer-events-none absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent2/70" />
        <span className="animate-fade-soft [animation-delay:760ms] pointer-events-none absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent2/70" />

        {/* เส้นเรืองแสงขอบล่าง แบบเดียวกับบนการ์ด */}
        <span className="animate-fade-soft [animation-delay:840ms] pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-accent/70 via-accent2/70 to-transparent" />
      </div>

      {/* แถบ thumbnail (แสดงเมื่อมีมากกว่า 1 รูป) */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(url)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                activeImage === url
                  ? 'border-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={url}
                alt={`ตัวอย่าง ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}