'use client'

import { useState } from 'react'
import LikeButton from '@/app/components/LikeButton'
import Icon from '@/app/components/Icon'

type PromptCardProps = {
  prompt: {
    prompt_id: string
    title: string
    prompt_text: string
    cover_image_url: string | null
    view_count: number
    like_count: number
    copy_count?: number
    categories: { name: string } | null
    media_types: { name: string } | null
  }
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleQuickCopy(e: React.MouseEvent) {
    e.preventDefault() // กันไม่ให้ลิงก์ทำงานตอนกดปุ่ม copy
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.prompt_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <a
      href={`/prompts/${prompt.prompt_id}`}
      className="group relative block rounded-xl overflow-hidden bg-[#12121c] border border-[#232336] transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_0_28px_rgba(0,229,255,0.22)]"
    >
      {/* มุมเรืองแสงแบบ HUD reticle โผล่ตอน hover */}
      <span className="pointer-events-none absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <span className="pointer-events-none absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <span className="pointer-events-none absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
      <span className="pointer-events-none absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {/* ภาพตัวอย่าง */}
      <div className="aspect-video bg-[#0a0a0f] overflow-hidden relative">
        {prompt.cover_image_url ? (
          <img
            src={prompt.cover_image_url}
            alt={prompt.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8888a0] text-sm font-mono">
            no_preview.img
          </div>
        )}

        {/* overlay ไล่สีเข้มด้านล่างภาพ เพื่อให้ปุ่มอ่านง่าย */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* ปุ่ม copy ด่วน มุมขวาบนของภาพ */}
        <button
          onClick={handleQuickCopy}
          className={`absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all opacity-0 group-hover:opacity-100 ${
            copied
              ? 'bg-emerald-500/90 border-emerald-400 text-white'
              : 'bg-[#0a0a0f]/80 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400'
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

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/60 via-fuchsia-400/60 to-transparent" />
      </div>

      {/* เนื้อหา */}
      <div className="p-4">
        <div className="flex gap-2 mb-2.5">
          {prompt.categories && (
            <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              {prompt.categories.name}
            </span>
          )}
          {prompt.media_types && (
            <span className="text-xs font-mono bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-fuchsia-400" />
              {prompt.media_types.name}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-[#f2f2f7] line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {prompt.title}
        </h3>
        <p className="text-sm text-[#8888a0] line-clamp-2 mt-1">{prompt.prompt_text}</p>

        {/* แถวล่าง: สถิติ + ปุ่มดูรายละเอียด */}
        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-[#232336]">
          <div className="flex items-center gap-3 text-xs text-[#666680] font-mono">
            <span className="flex items-center gap-1"><Icon name="eye" size={14} />{prompt.view_count}</span>
            {typeof prompt.copy_count === 'number' && <span className="flex items-center gap-1"><Icon name="copy" size={14} />{prompt.copy_count}</span>}
            <LikeButton
              promptId={prompt.prompt_id}
              initialLikeCount={prompt.like_count}
              insideLink
              size={13}
            />
          </div>

          <span className="text-xs font-mono text-cyan-400/80 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
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
    </a>
  )
}
