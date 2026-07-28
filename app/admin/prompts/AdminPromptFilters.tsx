'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SelectMenu from '@/app/components/SelectMenu'
import SearchBox, { type Suggestion } from '@/app/components/SearchBox'

type Option = { id: string; name: string }

const STATUS_OPTIONS = [
  { value: 'published', label: 'เผยแพร่แล้ว' },
  { value: 'draft', label: 'ฉบับร่าง' },
]

export default function AdminPromptFilters({
  categories,
  total,
}: {
  categories: Option[]
  total: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const category = searchParams.get('category') ?? ''
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  const activeCount = [category, status, q].filter(Boolean).length

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)

    const query = params.toString()
    router.push(query ? `/admin/prompts?${query}` : '/admin/prompts')
  }

  // รายการแนะนำดึงจากชื่อ prompt จริงในฐานข้อมูล เอาแค่ 6 รายการพอไม่ให้ลิสต์ยาวเกิน
  async function fetchSuggestions(keyword: string): Promise<Suggestion[]> {
    const escaped = keyword.replace(/[%_\\]/g, (ch) => `\\${ch}`)
    const { data } = await supabase
      .from('prompts')
      .select('prompt_id, title, categories(name)')
      .ilike('title', `%${escaped}%`)
      .order('created_at', { ascending: false })
      .limit(6)

    return ((data ?? []) as unknown as {
      prompt_id: string
      title: string
      categories: { name: string } | null
    }[]).map((row) => ({
      id: row.prompt_id,
      label: row.title,
      hint: row.categories?.name ?? undefined,
    }))
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <SearchBox
        value={q}
        placeholder="ค้นหาชื่อ prompt..."
        onSearch={(kw) => updateParam('q', kw || null)}
        fetchSuggestions={fetchSuggestions}
      />

      <SelectMenu
        className="w-52"
        ariaLabel="กรองตามหมวดหมู่"
        placeholder="ทุกหมวดหมู่"
        value={category}
        onChange={(v) => updateParam('category', v || null)}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />

      <SelectMenu
        className="w-44"
        ariaLabel="กรองตามสถานะ"
        placeholder="ทุกสถานะ"
        value={status}
        onChange={(v) => updateParam('status', v || null)}
        options={STATUS_OPTIONS}
      />

      <span className="font-mono text-xs text-faint">พบ {total} รายการ</span>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => router.push('/admin/prompts')}
          className="font-mono text-xs text-accent2 hover:opacity-80"
        >
          ✕ ล้างตัวกรอง ({activeCount})
        </button>
      )}
    </div>
  )
}
