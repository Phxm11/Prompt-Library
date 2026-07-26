'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
    router.push(`/?${params.toString()}`)
  }

  function clearAll() {
    router.push('/')
  }

  const selectClass =
    'bg-[#12121c] border border-[#232336] rounded-lg px-3 py-1.5 text-sm font-mono text-[#c8c8d4] focus:outline-none focus:border-cyan-400/60 transition-all cursor-pointer'

  return (
    <div className="space-y-3">
      {/* หมวดหมู่: ปุ่มแบบเดิม */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => updateParam('category', null)}
          className={`px-4 py-1.5 rounded-full text-sm font-mono border transition-all ${
            !activeCategory
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400 shadow-[0_0_16px_rgba(0,229,255,0.35)]'
              : 'bg-transparent text-[#8888a0] border-[#232336] hover:border-cyan-500/50 hover:text-cyan-300'
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
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400 shadow-[0_0_16px_rgba(0,229,255,0.35)]'
                : 'bg-transparent text-[#8888a0] border-[#232336] hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ประเภทสื่อ + โมเดล AI: dropdown กรองเพิ่มพร้อมกันได้ */}
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={activeMediaType ?? ''}
          onChange={(e) => updateParam('media_type', e.target.value || null)}
          className={selectClass}
        >
          <option value="">ทุกประเภทสื่อ</option>
          {mediaTypes.map((m) => (
            <option key={m.id} value={m.slug} className="bg-[#12121c]">
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={activeAiModel ?? ''}
          onChange={(e) => updateParam('ai_model', e.target.value || null)}
          className={selectClass}
        >
          <option value="">ทุกโมเดล AI</option>
          {aiModels.map((a) => (
            <option key={a.id} value={a.id} className="bg-[#12121c]">
              {a.name}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-mono text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
          >
            ✕ ล้างตัวกรองทั้งหมด ({activeCount})
          </button>
        )}
      </div>
    </div>
  )
}