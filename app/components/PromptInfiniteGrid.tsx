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
  mode: 'browse' | 'search'
  categoryId?: string | null
  mediaTypeId?: string | null
  aiModelId?: string | null
  query?: string
}

export default function PromptInfiniteGrid({
  initialPrompts,
  initialHasMore,
  mode,
  categoryId,
  mediaTypeId,
  aiModelId,
  query,
}: PromptInfiniteGridProps) {
  const supabase = createClient()

  // ถ้ามีการกรองด้วยโมเดล AI ต้อง fetch ใหม่ทั้งหมดฝั่ง client ตอน mount
  // (server ไม่ได้กรองส่วนนี้ให้ เพื่อให้ server-side query เรียบง่ายและเร็ว)
  const needsClientRefetch = mode === 'browse' && Boolean(aiModelId)

  const [prompts, setPrompts] = useState<Prompt[]>(needsClientRefetch ? [] : initialPrompts)
  const [hasMore, setHasMore] = useState(needsClientRefetch ? true : initialHasMore)
  const [loading, setLoading] = useState(needsClientRefetch)
  const [initializing, setInitializing] = useState(needsClientRefetch)
  const sentinelRef = useRef<HTMLDivElement>(null)

  async function getAllowedIdsForAiModel(): Promise<string[] | null> {
    if (mode !== 'browse' || !aiModelId) return null
    const { data, error } = await supabase
      .from('prompt_ai_models')
      .select('prompt_id')
      .eq('ai_model_id', aiModelId)
    if (error) return []
    return (data ?? []).map((r: { prompt_id: string }) => r.prompt_id)
  }

  async function fetchPage(from: number, to: number) {
    let allowedIds: string[] | null = null
    if (mode === 'browse' && aiModelId) {
      allowedIds = await getAllowedIdsForAiModel()
      if (!allowedIds || allowedIds.length === 0) {
        return { data: [] as Prompt[], reachedEnd: true }
      }
    }

    let q = supabase
      .from('prompts')
      .select('*, categories(name), media_types(name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .order('prompt_id', { ascending: true })
      .range(from, to)

    if (mode === 'browse') {
      if (categoryId) q = q.eq('category_id', categoryId)
      if (mediaTypeId) q = q.eq('media_type_id', mediaTypeId)
      if (allowedIds) q = q.in('prompt_id', allowedIds)
    }
    if (mode === 'search' && query) {
      q = q.textSearch('search_vector', query, { type: 'websearch', config: 'simple' })
    }

    const { data, error } = await q
    if (error) return { data: [] as Prompt[], reachedEnd: true }
    return { data: data ?? [], reachedEnd: (data ?? []).length < PAGE_SIZE }
  }

  // ตอน mount: ถ้าต้อง refetch เพราะกรองด้วยโมเดล AI ให้โหลดหน้าแรกใหม่เอง
  useEffect(() => {
    if (!needsClientRefetch) return

    let cancelled = false
    setInitializing(true)
    setLoading(true)

    fetchPage(0, PAGE_SIZE - 1).then(({ data, reachedEnd }) => {
      if (cancelled) return
      setPrompts(data)
      setHasMore(!reachedEnd)
      setLoading(false)
      setInitializing(false)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadMore() {
    if (loading || !hasMore || initializing) return
    setLoading(true)

    const from = prompts.length
    const to = from + PAGE_SIZE - 1
    const { data, reachedEnd } = await fetchPage(from, to)

    setPrompts((prev) => {
      const existingIds = new Set(prev.map((p) => p.prompt_id))
      const uniqueNewData = data.filter((p: Prompt) => !existingIds.has(p.prompt_id))
      return [...prev, ...uniqueNewData]
    })
    setHasMore(!reachedEnd)
    setLoading(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '400px' }
    )

    const el = sentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts.length, hasMore, loading, initializing])

  if (initializing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden bg-surface border border-line animate-pulse aspect-[4/5]"
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {prompts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted font-mono text-sm">
            {'>'} ไม่พบ Prompt ที่ตรงกับตัวกรองนี้
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* +2 คือให้การ์ดเริ่มไล่หลังหัวข้อกับตัวกรองของหน้า, %PAGE_SIZE คือรีเซ็ตจังหวะทุกหน้าที่โหลดเพิ่ม */}
        {prompts.map((prompt, i) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} index={(i % PAGE_SIZE) + 2} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {loading && !initializing && (
        <div className="flex items-center justify-center gap-2 py-8 text-accent/80 font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
          <span className="ml-2">กำลังโหลดเพิ่ม...</span>
        </div>
      )}

      {!hasMore && prompts.length > 0 && (
        <p className="text-center py-8 text-faint font-mono text-xs">
          {'>'} สิ้นสุดรายการแล้ว ({prompts.length} รายการ)
        </p>
      )}
    </>
  )
}