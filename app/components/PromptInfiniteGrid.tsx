'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PromptCard from '@/app/components/PromptCard'
import EmptyState from '@/app/components/EmptyState'
import ErrorState from '@/app/components/ErrorState'
import { PAGE_SIZE, promptPageQuery, type PromptSummary } from '@/lib/promptQuery'

type PromptInfiniteGridProps = {
  initialPrompts: PromptSummary[]
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

  const [prompts, setPrompts] = useState(initialPrompts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const offset = useRef(initialPrompts.length)
  const inFlight = useRef(false)

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore) return
    inFlight.current = true
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await promptPageQuery(supabase, {
        categoryId, mediaTypeId, aiModelId, query: mode === 'search' ? query : undefined,
      }, offset.current)
      if (error) throw error
      const page = (data ?? []).slice(0, PAGE_SIZE)
      offset.current += page.length
      setPrompts(previous => {
        const ids = new Set(previous.map(p => p.prompt_id))
        return [...previous, ...page.filter(p => !ids.has(p.prompt_id))]
      })
      setHasMore((data ?? []).length > PAGE_SIZE)
    } catch {
      setError('โหลดรายการเพิ่มไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [supabase, hasMore, categoryId, mediaTypeId, aiModelId, mode, query])

  useEffect(() => {
    if (error || loading || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore()
        }
      },
      { rootMargin: '400px' }
    )

    const el = sentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [prompts.length, hasMore, loading, error, loadMore])

  return (
    <>
      {prompts.length === 0 && (
        <EmptyState
          icon="search"
          title={mode === 'search' ? 'ไม่พบ Prompt ที่ตรงกับคำค้นหานี้' : 'ไม่พบ Prompt ที่ตรงกับตัวกรองนี้'}
          description={mode === 'search' ? 'ลองใช้คำอื่น หรือสะกดให้สั้นลง' : 'ลองเปลี่ยนหมวดหมู่ ประเภทสื่อ หรือโมเดล AI ดู'}
        />
      )}

      {/* isolate = การ์ดที่ยกตัวขึ้นตอน hover (z-10) จะยกได้แค่ในกริดนี้ ไม่ทะลุขึ้นไปทับเมนู/รายการแนะนำข้างบน */}
      <div className="isolate grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* +2 คือให้การ์ดเริ่มไล่หลังหัวข้อกับตัวกรองของหน้า, %PAGE_SIZE คือรีเซ็ตจังหวะทุกหน้าที่โหลดเพิ่ม */}
        {prompts.map((prompt, i) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} index={(i % PAGE_SIZE) + 2} />
        ))}
      </div>

      {error && (
        <div className="my-4 space-y-3">
          <ErrorState message={error} />
          <button onClick={() => void loadMore()} disabled={loading} className="text-accent underline">ลองใหม่</button>
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />

      {loading && (
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