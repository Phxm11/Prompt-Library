'use client'

import { useState } from 'react'

type ImageGalleryProps = {
  coverImageUrl: string | null
  examples: { example_id: string; file_url: string }[]
  title: string
}

export default function ImageGallery({ coverImageUrl, examples, title }: ImageGalleryProps) {
  // รวมภาพหลักกับภาพตัวอย่างเข้าด้วยกัน (ตัดรูปซ้ำออก)
  const allImages = [
    ...(coverImageUrl ? [coverImageUrl] : []),
    ...examples.map((e) => e.file_url),
  ]

  const [activeImage, setActiveImage] = useState(allImages[0] ?? null)

  if (allImages.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        ไม่มีภาพตัวอย่าง
      </div>
    )
  }

  return (
    <div>
      {/* ภาพหลัก */}
      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
        <img
          src={activeImage ?? allImages[0]}
          alt={title}
          className="w-full h-full object-cover"
        />
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