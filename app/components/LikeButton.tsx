'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type LikeButtonProps = {
  promptId: string
  initialLikeCount: number
  size?: number
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
  const router = useRouter()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadFavorite() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      setUserId(user?.id ?? null)
      if (!user) return

      const { data } = await supabase
        .from('favorites')
        .select('favorite_id')
        .eq('user_id', user.id)
        .eq('prompt_id', promptId)
        .maybeSingle()

      if (!cancelled) setLiked(Boolean(data))
    }

    void loadFavorite()
    return () => {
      cancelled = true
    }
  }, [promptId, supabase])

  async function handleToggle(event: React.MouseEvent) {
    if (insideLink) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (!userId) {
      router.push(`/login?next=/prompts/${promptId}`)
      return
    }
    if (busy) return

    setBusy(true)
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeCount((count) => (nextLiked ? count + 1 : Math.max(count - 1, 0)))

    try {
      const favoriteRequest = nextLiked
        ? supabase.from('favorites').insert({ user_id: userId, prompt_id: promptId })
        : supabase.from('favorites').delete().eq('user_id', userId).eq('prompt_id', promptId)
      const { error: favoriteError } = await favoriteRequest
      if (favoriteError) throw favoriteError

      const { error: countError } = await supabase.rpc(
        nextLiked ? 'increment_like_count' : 'decrement_like_count',
        { prompt_id_input: promptId }
      )
      if (countError) throw countError

      router.refresh()
    } catch (error) {
      console.error('Like toggle failed:', error)
      setLiked(!nextLiked)
      setLikeCount((count) => (nextLiked ? Math.max(count - 1, 0) : count + 1))
    } finally {
      setBusy(false)
    }
  }

  const notLoggedIn = userId === null

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      title={notLoggedIn ? 'เข้าสู่ระบบเพื่อบันทึกรายการโปรด' : liked ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
      className={`flex items-center gap-1.5 transition-transform active:scale-90 disabled:opacity-60 ${
        insideLink
          ? 'w-9 h-9 rounded-lg backdrop-blur-md border justify-center ' +
            (liked
              ? 'bg-accent2/20 border-accent2 text-accent2'
              : 'bg-base/80 border-accent2/30 text-ink-soft hover:border-accent2/60 hover:text-accent2')
          : 'text-ink-soft hover:text-accent2'
      }`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={liked ? '#ff3ec8' : 'none'} stroke={liked ? '#ff3ec8' : 'currentColor'} strokeWidth="2" className="transition-colors">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {showCount && <span className="text-xs font-mono">{likeCount}</span>}
    </button>
  )
}
