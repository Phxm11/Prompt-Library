import { createClient } from '@/lib/supabase/server'
import PromptInfiniteGrid from '@/app/components/PromptInfiniteGrid'
import SearchBar from '@/app/components/SearchBar'
import { promptSearchFilter } from '@/lib/promptSearch'

const PAGE_SIZE = 12

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const supabase = await createClient()

  let prompts: any[] = []
  let hasMore = false
  let error: string | null = null

  if (query) {
    const { data, count, error: searchError } = await supabase
      .from('prompts')
      .select('*, categories(name), media_types(name)', { count: 'exact' })
      .eq('is_public', true)
      .or(promptSearchFilter(query))
      .order('created_at', { ascending: false })
      .order('prompt_id', { ascending: true })
      .range(0, PAGE_SIZE - 1)

    if (searchError) {
      error = searchError.message
    } else {
      prompts = data ?? []
      hasMore = (count ?? 0) > PAGE_SIZE
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="section-title text-4xl font-extrabold mb-6 text-ink">
        ค้นหา Prompt
      </h1>

      <div className="max-w-xl mb-8">
        <SearchBar initialQuery={query} />
      </div>

      {!query && (
        <p className="text-muted font-mono text-sm py-12 text-center">
          {'>'} พิมพ์คำค้นหาด้านบนเพื่อเริ่มค้นหา
        </p>
      )}

      {query && (
        <p className="text-faint text-sm font-mono mb-4">
          ผลการค้นหาสำหรับ "<span className="text-accent">{query}</span>"
        </p>
      )}

      {error && (
        <p className="text-accent2 bg-accent2/10 border border-accent2/30 rounded-lg px-4 py-3">
          เกิดข้อผิดพลาด: {error}
        </p>
      )}

      {query && !error && prompts.length === 0 && (
        <p className="text-muted font-mono text-sm py-12 text-center">
          {'>'} ไม่พบ Prompt ที่ตรงกับคำค้นหานี้ ลองใช้คำอื่นดูครับ
        </p>
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