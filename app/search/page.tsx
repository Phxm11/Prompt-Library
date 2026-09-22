import { createClient } from '@/lib/supabase/server'
import PromptInfiniteGrid from '@/app/components/PromptInfiniteGrid'
import SearchBar from '@/app/components/SearchBar'
import EmptyState from '@/app/components/EmptyState'
import ErrorState from '@/app/components/ErrorState'
import { PAGE_SIZE, promptPageQuery, type PromptSummary } from '@/lib/promptQuery'



export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const supabase = await createClient()

  let prompts: PromptSummary[] = []
  let hasMore = false
  let error: string | null = null

  if (query) {
    const { data, error: searchError } = await promptPageQuery(supabase, { query })

    if (searchError) {
      error = searchError.message
    } else {
      prompts = (data ?? []).slice(0, PAGE_SIZE)
      hasMore = (data ?? []).length > PAGE_SIZE
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="section-title text-4xl font-extrabold mb-6 text-ink">
        ค้นหา Prompt
      </h1>

      {/*
        relative z-30 จำเป็น ไม่ใช่ของประดับ
        รายการแนะนำเป็น absolute ที่ลอยทับผลการค้นหาข้างล่าง ถ้ากล่องนี้ไม่มี z ของตัวเอง
        การ์ดผลลัพธ์ (ซึ่งมี transform จากอนิเมชันและ hover:z-10) จะขึ้นมาทับ รายการแนะนำเลยเหมือนมุดหายไป
      */}
      <div className="relative z-30 max-w-xl mb-8">
        <SearchBar initialQuery={query} />
      </div>

      {!query && (
        <p className="text-muted font-mono text-sm py-12 text-center">
          {'>'} พิมพ์คำค้นหาด้านบนเพื่อเริ่มค้นหา
        </p>
      )}

      {query && (
        <p className="text-faint text-sm font-mono mb-4">
          ผลการค้นหาสำหรับ &quot;<span className="text-accent">{query}</span>&quot;
        </p>
      )}

      {error && <ErrorState message={error} />}

      {query && !error && prompts.length === 0 && (
        <EmptyState
          icon="search"
          title="ไม่พบ Prompt ที่ตรงกับคำค้นหานี้"
          description="ลองใช้คำอื่น หรือสะกดให้สั้นลงดูครับ"
        />
      )}

      {query && !error && prompts.length > 0 && (
        <PromptInfiniteGrid
          key={query}
          initialPrompts={prompts}
          initialHasMore={hasMore}
          mode="search"
          query={query}
        />
      )}
    </div>
  )
}