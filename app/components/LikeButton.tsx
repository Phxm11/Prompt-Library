'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const LIKED_IDS_KEY = 'prompt_library_liked_ids'

function getLikedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LIKED_IDS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveLikedIds(ids: string[]) {
  localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(ids))
}

type LikeButtonProps = {
  promptId: string
  initialLikeCount: number
  size?: number
  // true เมื่อปุ่มนี้อยู่ในการ์ดที่เป็นลิงก์ (ต้องกันไม่ให้คลิกแล้วลิงก์ทำงานด้วย)
  insideLink?: boolean
  showCount?: boolean
}

export default function LikeButton({
  promptId,
  initialLikeCount,
  size = 18,
  insideLink = false,
  showCount = true,
}: LikeButtonProps) {
  const supabase = createClient()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setLiked(getLikedIds().includes(promptId))
  }, [promptId])

  async function handleToggle(e: React.MouseEvent) {
    if (insideLink) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (busy) return
    setBusy(true)

    const nextLiked = !liked
    const currentIds = getLikedIds()

    // optimistic update: อัปเดตหน้าจอทันทีก่อนรอ server ตอบกลับ
    setLiked(nextLiked)
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(prev - 1, 0)))

    try {
      if (nextLiked) {
        saveLikedIds([...currentIds, promptId])
        const { error } = await supabase.rpc('increment_like_count', { prompt_id_input: promptId })
        if (error) throw error
      } else {
        saveLikedIds(currentIds.filter((id) => id !== promptId))
        const { error } = await supabase.rpc('decrement_like_count', { prompt_id_input: promptId })
        if (error) throw error
      }
    } catch (err) {
      // ถ้า error ให้ย้อนกลับสถานะเดิม
      console.error('Like toggle failed:', err)
      setLiked(!nextLiked)
      setLikeCount((prev) => (nextLiked ? Math.max(prev - 1, 0) : prev + 1))
      saveLikedIds(currentIds)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 transition-transform active:scale-90 ${
        insideLink
          ? 'w-9 h-9 rounded-lg backdrop-blur-md border justify-center ' +
            (liked
              ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300'
              : 'bg-[#0a0a0f]/80 border-fuchsia-400/30 text-[#c8c8d4] hover:border-fuchsia-400/60 hover:text-fuchsia-300')
          : 'text-[#c8c8d4] hover:text-fuchsia-300'
      }`}
      title={liked ? 'เลิกถูกใจ' : 'ถูกใจ'}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={liked ? '#ff3ec8' : 'none'}
        stroke={liked ? '#ff3ec8' : 'currentColor'}
        strokeWidth="2"
        className="transition-colors"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {showCount && <span className="text-xs font-mono">{likeCount}</span>}
    </button>
  )
}