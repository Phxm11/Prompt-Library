'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SelectMenu from '@/app/components/SelectMenu'
import SearchBox, { type Suggestion } from '@/app/components/SearchBox'

const RATING_OPTIONS = [
  { value: '5', label: '★★★★★ (5)' },
  { value: '4', label: '★★★★ (4)' },
  { value: '3', label: '★★★ (3)' },
  { value: '2', label: '★★ (2)' },
  { value: '1', label: '★ (1)' },
]

const REVIEWER_OPTIONS = [
  { value: 'member', label: 'สมาชิก' },
  { value: 'guest', label: 'ผู้เยี่ยมชม' },
]

export default function AdminReviewFilters({ total }: { total: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const rating = searchParams.get('rating') ?? ''
  const reviewer = searchParams.get('reviewer') ?? ''
  const q = searchParams.get('q') ?? ''
  const activeCount = [rating, reviewer, q].filter(Boolean).length

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)

    const query = params.toString()
    router.push(query ? `/admin/reviews?${query}` : '/admin/reviews')
  }

  /*
    คำค้นใช้ได้ทั้งชื่อ prompt และข้อความในรีวิว
    รายการแนะนำหยิบมาจากชื่อ prompt เพราะเป็นสิ่งที่แอดมินไล่หาบ่อยสุด เอาแค่ 6 รายการพอ
  */
  async function fetchSuggestions(keyword: string): Promise<Suggestion[]> {
    const escaped = keyword.replace(/[%_\\]/g, (ch) => `\\${ch}`)
    const { data } = await supabase
      .from('prompts')
      .select('prompt_id, title')
      .ilike('title', `%${escaped}%`)
      .order('created_at', { ascending: false })
      .limit(6)

    return ((data ?? []) as { prompt_id: string; title: string }[]).map((row) => ({
      id: row.prompt_id,
      label: row.title,
      hint: 'prompt',
    }))
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <SearchBox
        value={q}
        placeholder="ค้นหาชื่อ prompt หรือข้อความรีวิว..."
        onSearch={(kw) => updateParam('q', kw || null)}
        fetchSuggestions={fetchSuggestions}
      />

      <SelectMenu
        className="w-44"
        ariaLabel="กรองตามคะแนน"
        placeholder="ทุกคะแนน"
        value={rating}
        onChange={(v) => updateParam('rating', v || null)}
        options={RATING_OPTIONS}
      />

      <SelectMenu
        className="w-40"
        ariaLabel="กรองตามผู้รีวิว"
        placeholder="ผู้รีวิวทุกแบบ"
        value={reviewer}
        onChange={(v) => updateParam('reviewer', v || null)}
        options={REVIEWER_OPTIONS}
      />

      <span className="font-mono text-xs text-faint">พบ {total} รีวิว</span>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => router.push('/admin/reviews')}
          className="font-mono text-xs text-accent2 hover:opacity-80"
        >
          ✕ ล้างตัวกรอง ({activeCount})
        </button>
      )}
    </div>
  )
}
