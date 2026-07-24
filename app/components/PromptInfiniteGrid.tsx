'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PromptCard from '@/app/components/PromptCard'

const PAGE_SIZE = 12

type Prompt = {
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

type PromptInfiniteGridProps = {
  initialPrompts: Prompt[]
  initialHasMore: boolean
  // 'browse' = หน้ารายการ/หมวดหมู่ทั่วไป, 'search' = หน้าค้นหา
  mode: 'browse' | 'search'
  categoryId?: string | null
  query?: string
}

export default function PromptInfiniteGrid({
  initialPrompts,
  initialHasMore,
  mode,
  categoryId,
  query,
}: PromptInfiniteGridProps) {
  const supabase = createClient()
  const [prompts, setPrompts] = useState(initialPrompts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    const from = prompts.length
    const to = from + PAGE_SIZE - 1

    let q = supabase
      .from('prompts')
      .select('*, categories(name), media_types(name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .order('prompt_id', { ascending: true }) // tie-breaker กันลำดับสลับตอน created_at ซ้ำกัน
      .range(from, to)

    if (mode === 'browse' && categoryId) {
      q = q.eq('category_id', categoryId)
    }
    if (mode === 'search' && query) {
      q = q.textSearch('search_vector', query, { type: 'websearch', config: 'simple' })
    }

    const { data, error } = await q

    if (!error && data) {
      setPrompts((prev) => {
        const existingIds = new Set(prev.map((p) => p.prompt_id))
        const uniqueNewData = data.filter((p: Prompt) => !existingIds.has(p.prompt_id))
        return [...prev, ...uniqueNewData]
      })
      setHasMore(data.length === PAGE_SIZE)
    } else {
      setHasMore(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '400px' } // เริ่มโหลดก่อนถึงล่างสุดจริง 400px ให้ลื่นขึ้น
    )

    const el = sentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts.length, hasMore, loading])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} />
        ))}
      </div>

      {/* จุดสังเกตด้านล่างสุด - พอ scroll มาถึงจะสั่งโหลดหน้าต่อไป */}
      <div ref={sentinelRef} className="h-1" />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-cyan-400/80 font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]" />
          <span className="ml-2">กำลังโหลดเพิ่ม...</span>
        </div>
      )}

      {!hasMore && prompts.length > 0 && (
        <p className="text-center py-8 text-[#666680] font-mono text-xs">
          {'>'} สิ้นสุดรายการแล้ว ({prompts.length} รายการ)
        </p>
      )}
    </>
  )
}