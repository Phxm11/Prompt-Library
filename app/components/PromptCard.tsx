'use client'

import { useState, ViewTransition } from 'react'
import Link from 'next/link'
import LikeButton from '@/app/components/LikeButton'
import Icon from '@/app/components/Icon'
import { showToast } from '@/app/components/Toast'
import { recordCopy } from '@/lib/recordCopy'
import { getGuestId } from '@/lib/guestId'

type PromptCardProps = {
  prompt: {
    prompt_id: string
    title: string
    prompt_text: string
    cover_image_url: string | null
    cover_position?: string | null
    cover_zoom?: number | null
    status?: string | null
    view_count: number
    like_count: number
    copy_count?: number
    categories: { name: string } | null
    media_types: { name: string } | null
  }
  /** ลำดับในกริด ใช้ไล่จังหวะตอนการ์ดเด้งขึ้นมา */
  index?: number
}

// ไล่ทีละ 60ms แต่ไม่เกิน 12 ใบ ไม่งั้นการ์ดท้าย ๆ ของ infinite scroll จะรอนานเกินไป
const STAGGER_MS = 60
const MAX_STAGGER_STEPS = 12

export default function PromptCard({ prompt, index = 0 }: PromptCardProps) {
  const [copied, setCopied] = useState(false)
  // เก็บยอดไว้ใน state เพื่อให้ตัวเลขบนการ์ดขยับทันทีที่กดคัดลอก โดยไม่ต้องรีโหลดหน้า
  const [copyCount, setCopyCount] = useState(prompt.copy_count)

  async function handleQuickCopy(e: React.MouseEvent) {
    e.preventDefault() // กันไม่ให้ลิงก์ทำงานตอนกดปุ่ม copy
    e.stopPropagation()
    try {
      // เขียนคลิปบอร์ดก่อนเสมอ ห้ามมี await คั่นก่อนหน้านี้
      // ไม่งั้นบางเบราว์เซอร์จะถือว่าหลุดจากการกดของผู้ใช้แล้วสั่งคัดลอกไม่ได้
      await navigator.clipboard.writeText(prompt.prompt_text)
      setCopied(true)
      showToast('คัดลอก Prompt แล้ว')
      setTimeout(() => setCopied(false), 1500)

      // นับยอดด้วยกติกาเดียวกับปุ่มในหน้ารายละเอียด คือคนละ 1 ครั้ง
      const { counted } = await recordCopy(prompt.prompt_id, getGuestId())
      if (counted) setCopyCount((prev) => (typeof prev === 'number' ? prev + 1 : prev))
    } catch (err) {
      console.error('Copy failed:', err)
      showToast('คัดลอกไม่สำเร็จ ลองใหม่อีกครั้ง', 'error')
    }
  }

  return (
    // แยกชั้นนอกไว้รับอนิเมชันตอนโผล่ เพราะ animation ที่ fill: both จะค้าง transform ไว้
    // ทับ transform ตอน hover ถ้าอยู่ element เดียวกัน
    //
    // ส่วน transition ของการ์ดต้องระบุ translate/scale ตรง ๆ เพราะ Tailwind v4
    // เขียน utility พวกนี้ลง CSS property แยก ไม่ได้รวมอยู่ใน transform อีกต่อไป
    <div
      className="animate-spring-up h-full"
      style={{ animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms` }}
    >
      <Link
        href={`/prompts/${prompt.prompt_id}`}
        className="group relative flex h-full flex-col rounded-xl overflow-hidden bg-surface border border-line hover:z-10 transition-[translate,scale,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-accent/70 hover:shadow-[0_18px_50px_-12px_rgba(0,229,255,0.45)] hover:-translate-y-2 hover:scale-[1.02]"
      >
      {/* มุมเรืองแสงแบบ HUD reticle โผล่ตอน hover */}
      <span className="pointer-events-none absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <span className="pointer-events-none absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <span className="pointer-events-none absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent2 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent2 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {/* ภาพตัวอย่าง */}
      <div className="aspect-video shrink-0 bg-base overflow-hidden relative">
        {prompt.cover_image_url ? (
          // ชื่อเดียวกับรูปใหญ่ในหน้ารายละเอียด เบราว์เซอร์จะมอร์ฟรูปนี้ไปเป็นรูปนั้นตอนกด
          <ViewTransition name={`prompt-cover-${prompt.prompt_id}`}>
            <img
              src={prompt.cover_image_url}
              alt={prompt.title}
              style={{
                objectPosition: prompt.cover_position ?? '50% 50%',
                transform: `scale(${prompt.cover_zoom ?? 1})`,
              }}
              className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
            />
          </ViewTransition>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm font-mono">
            no_preview.img
          </div>
        )}

        {/* ป้ายบอกว่ายังเป็นฉบับร่าง เห็นเฉพาะเจ้าของเพราะคนอื่นมองไม่เห็น prompt ที่ยังไม่เผยแพร่ */}

        {prompt.status === 'draft' && (

          <span className="absolute top-3 left-3 z-10 rounded-full border border-accent2/50 bg-base/85 px-2.5 py-1 font-mono text-[11px] text-accent2 backdrop-blur">

            ฉบับร่าง

          </span>

        )}


        {/* overlay ไล่สีเข้มด้านล่างภาพ เพื่อให้ปุ่มอ่านง่าย */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* ปุ่ม copy ด่วน มุมขวาบนของภาพ */}
        <button
          onClick={handleQuickCopy}
          className={`absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all opacity-0 group-hover:opacity-100 ${
            copied
              ? 'bg-emerald-500/90 border-emerald-400 text-white'
              : 'bg-base/80 border-accent/40 text-accent hover:bg-accent/20 hover:border-accent'
          }`}
          title="คัดลอก Prompt"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-accent/60 via-accent2/60 to-transparent" />
      </div>

      {/* เนื้อหา */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex gap-2 mb-2.5">
          {prompt.categories && (
            <span className="text-xs font-mono bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-accent" />
              {prompt.categories.name}
            </span>
          )}
          {prompt.media_types && (
            <span className="text-xs font-mono bg-accent2/10 text-accent2 border border-accent2/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-accent2" />
              {prompt.media_types.name}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-ink line-clamp-1 group-hover:text-accent transition-colors">
          {prompt.title}
        </h3>
        <p className="text-sm text-muted line-clamp-2 mt-1">{prompt.prompt_text}</p>

        {/* แถวล่าง: สถิติ + ปุ่มดูรายละเอียด — ดันไปชิดล่างเสมอ การ์ดในแถวเดียวกันจะได้ตรงกัน */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-line">
          <div className="flex items-center gap-3 text-xs text-faint font-mono">
            <span className="flex items-center gap-1"><Icon name="eye" size={14} />{prompt.view_count}</span>
            {typeof copyCount === 'number' && <span className="flex items-center gap-1"><Icon name="copy" size={14} />{copyCount}</span>}
            <LikeButton
              promptId={prompt.prompt_id}
              initialLikeCount={prompt.like_count}
              insideLink
              size={13}
            />
          </div>

          <span className="text-xs font-mono text-accent/80 group-hover:text-accent flex items-center gap-1 transition-colors">
            ดูรายละเอียด
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="group-hover:translate-x-0.5 transition-transform"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
