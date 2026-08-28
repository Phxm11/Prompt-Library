'use client'

/*
  ตัวอย่าง prompt ที่ไล่โชว์ทีละอันบนหน้าแรก — แทนที่แบนเนอร์รูปนิ่งเดิม
  ให้คนเห็นตั้งแต่แรกว่าเว็บนี้ทำอะไรจริง ๆ (มี prompt พร้อมใช้ กดคัดลอกได้เลย)
  แทนที่จะบอกด้วยไอคอน + ตัวเลขลอย ๆ แบบเทมเพลตทั่วไป

  ตัวเลขคัดลอกในการ์ดนี้เป็นของประกอบฉาก ไม่ใช่ query จริงจาก DB โดยตั้งใจ
  จึงเลี่ยงคำที่ทำให้เข้าใจผิดว่าเป็นสถิติจริง ใช้คำว่า "ตัวอย่าง" กำกับไว้แทน
*/

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/app/components/Icon'

type Sample = {
  tag: string
  color: 'accent' | 'accent2'
  icon: 'image' | 'video' | 'document'
  text: string
}

const samples: Sample[] = [
  {
    tag: 'รูปภาพ',
    color: 'accent',
    icon: 'image',
    text: 'ภาพถ่ายอาหารสตรีทฟู้ดไทย แสงธรรมชาติยามเช้า มุมกล้อง 45 องศา พื้นหลังโต๊ะไม้เก่า, photorealistic, 85mm, ชัดตื้น',
  },
  {
    tag: 'วิดีโอ',
    color: 'accent2',
    icon: 'video',
    text: 'ไทม์แลปส์เมฆลอยเหนือทุ่งนาตอนพระอาทิตย์ตก โทนสีทองอมส้ม กล้องนิ่ง ต่อเนื่อง 10 วินาที ไม่มีตัด',
  },
  {
    tag: 'งานนำเสนอ',
    color: 'accent',
    icon: 'document',
    text: 'สไลด์เปิดตัวสินค้าใหม่ ธีมมินิมอล พื้นขาว ตัวอักษรหนา เน้นสีเดียว เหมาะกับพรีเซนต์นักลงทุน',
  },
]

export default function HeroDemo() {
  const [active, setActive] = useState(0)
  const [justCopied, setJustCopied] = useState(false)

  useEffect(() => {
    // เคารพคนที่ตั้งค่าลดการเคลื่อนไหวไว้ — ค้างที่ตัวอย่างแรกเฉย ๆ ไม่ไล่วนให้
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const cycle = setInterval(() => {
      setJustCopied(true)
      window.setTimeout(() => {
        setActive((v) => (v + 1) % samples.length)
        setJustCopied(false)
      }, 650)
    }, 3600)
    return () => clearInterval(cycle)
  }, [])

  const sample = samples[active]
  const isAccent = sample.color === 'accent'

  return (
    <Link
      href="/home"
      className="group animate-spring-up [animation-delay:500ms] relative mx-auto block w-full max-w-md lg:mx-0"
    >
      {/* เรืองแสงข้างหลังการ์ด ไล่สีตามตัวอย่างที่กำลังโชว์ */}
      <div
        className={`absolute -inset-6 rounded-[2rem] blur-3xl opacity-40 transition-colors duration-700 pointer-events-none ${
          isAccent ? 'bg-accent/30' : 'bg-accent2/30'
        }`}
      />

      <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--line)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_65%,transparent)] backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-translate-y-1">
        {/* แถบหัวหน้าต่างจำลอง ให้ความรู้สึกเหมือนไฟล์ prompt จริง ๆ */}
        <div className="flex items-center gap-1.5 border-b border-[color-mix(in_srgb,var(--line)_70%,transparent)] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-2 font-mono text-[11px] text-faint">prompt.txt</span>
        </div>

        <div className="p-5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors duration-500 ${
              isAccent
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-accent2/40 bg-accent2/10 text-accent2'
            }`}
          >
            <Icon name={sample.icon} size={12} />
            {sample.tag}
          </span>

          <p
            key={active}
            className="animate-spring-up mt-3 min-h-[4.5rem] font-mono text-[13px] leading-relaxed text-ink-soft"
          >
            {sample.text}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-[color-mix(in_srgb,var(--line)_70%,transparent)] pt-3">
            <span className="font-mono text-[11px] text-faint">ตัวอย่างจาก Prompt ในคลัง</span>
            <span
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[12px] transition-all duration-300 ${
                justCopied ? 'border-accent/60 bg-accent/15 text-accent' : 'border-line text-ink-soft'
              }`}
            >
              <Icon name={justCopied ? 'sparkles' : 'copy'} size={13} />
              {justCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}