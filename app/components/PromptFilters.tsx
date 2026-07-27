'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import SelectMenu from '@/app/components/SelectMenu'

type Option = { id: string; name: string; slug?: string }

type PromptFiltersProps = {
  categories: Option[]
  mediaTypes: Option[]
  aiModels: Option[]
}

export default function PromptFilters({ categories, mediaTypes, aiModels }: PromptFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category')
  const activeMediaType = searchParams.get('media_type')
  const activeAiModel = searchParams.get('ai_model')

  const activeCount = [activeCategory, activeMediaType, activeAiModel].filter(Boolean).length

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/home?${params.toString()}`)
  }

  function clearAll() {
    router.push('/home')
  }


  return (
    <div className="space-y-3">
      {/* หมวดหมู่: ปุ่มแบบเดิม */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => updateParam('category', null)}
          className={`px-4 py-1.5 rounded-full text-sm font-mono border transition-all ${
            !activeCategory
              ? 'bg-accent/10 text-accent border-accent shadow-[0_0_16px_rgba(0,229,255,0.35)]'
              : 'bg-transparent text-muted border-line hover:border-accent/50 hover:text-accent'
          }`}
        >
          ทั้งหมด
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParam('category', cat.slug === activeCategory ? null : cat.slug!)}
            className={`px-4 py-1.5 rounded-full text-sm font-mono border transition-all ${
              activeCategory === cat.slug
                ? 'bg-accent/10 text-accent border-accent shadow-[0_0_16px_rgba(0,229,255,0.35)]'
                : 'bg-transparent text-muted border-line hover:border-accent/50 hover:text-accent'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ประเภทสื่อ + โมเดล AI: dropdown กรองเพิ่มพร้อมกันได้ */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SelectMenu
          className="w-48"
          ariaLabel="กรองตามประเภทสื่อ"
          placeholder="ทุกประเภทสื่อ"
          value={activeMediaType ?? ''}
          onChange={(v) => updateParam('media_type', v || null)}
          options={mediaTypes.map((m) => ({ value: m.slug!, label: m.name }))}
        />

        <SelectMenu
          className="w-48"
          ariaLabel="กรองตามโมเดล AI"
          placeholder="ทุกโมเดล AI"
          value={activeAiModel ?? ''}
          onChange={(v) => updateParam('ai_model', v || null)}
          options={aiModels.map((a) => ({ value: a.id, label: a.name }))}
        />

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-mono text-accent2 hover:text-accent2 flex items-center gap-1"
          >
            ✕ ล้างตัวกรองทั้งหมด ({activeCount})
          </button>
        )}
      </div>
    </div>
  )
}