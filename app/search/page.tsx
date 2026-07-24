import { createClient } from '@/lib/supabase/server'
import PromptInfiniteGrid from '@/app/components/PromptInfiniteGrid'
import SearchBar from '@/app/components/SearchBar'

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
      .textSearch('search_vector', query, { type: 'websearch', config: 'simple' })
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
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // search
      </p>
      <h1
        className="text-3xl font-bold mb-6 text-[#f2f2f7]"
      >
        ค้นหา Prompt
      </h1>

      <div className="max-w-xl mb-8">
        <SearchBar initialQuery={query} />
      </div>

      {!query && (
        <p className="text-[#8888a0] font-mono text-sm py-12 text-center">
          {'>'} พิมพ์คำค้นหาด้านบนเพื่อเริ่มค้นหา
        </p>
      )}

      {query && (
        <p className="text-[#666680] text-sm font-mono mb-4">
          ผลการค้นหาสำหรับ "<span className="text-cyan-300">{query}</span>"
        </p>
      )}

      {error && (
        <p className="text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg px-4 py-3">
          เกิดข้อผิดพลาด: {error}
        </p>
      )}

      {query && !error && prompts.length === 0 && (
        <p className="text-[#8888a0] font-mono text-sm py-12 text-center">
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