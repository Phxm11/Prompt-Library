'use client'

import { useState } from 'react'
import CategoriesPanel, { type Category } from '@/app/admin/catalog/CategoriesPanel'
import MediaTypesPanel, { type MediaType } from '@/app/admin/catalog/MediaTypesPanel'
import AiModelsPanel, { type AiModel } from '@/app/admin/catalog/AiModelsPanel'
import TagsPanel, { type Tag } from '@/app/admin/catalog/TagsPanel'

type TabId = 'categories' | 'media_types' | 'ai_models' | 'tags'

export default function CatalogTabs({
  categories,
  mediaTypes,
  aiModels,
  tags,
}: {
  categories: Category[]
  mediaTypes: MediaType[]
  aiModels: AiModel[]
  tags: Tag[]
}) {
  const [tab, setTab] = useState<TabId>('categories')

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'categories', label: 'หมวดหมู่', count: categories.length },
    { id: 'media_types', label: 'ประเภทสื่อ', count: mediaTypes.length },
    { id: 'ai_models', label: 'AI Models', count: aiModels.length },
    { id: 'tags', label: 'แท็ก', count: tags.length },
  ]

  return (
    <div>
      <div className="flex gap-1 border-b border-line mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 font-mono text-sm border-b-2 transition-all -mb-px ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label} <span className="text-faint">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === 'categories' && <CategoriesPanel initialRows={categories} />}
      {tab === 'media_types' && <MediaTypesPanel initialRows={mediaTypes} />}
      {tab === 'ai_models' && (
        <AiModelsPanel
          initialRows={aiModels}
          mediaTypes={mediaTypes.map((m) => ({ media_type_id: m.media_type_id, name: m.name }))}
        />
      )}
      {tab === 'tags' && <TagsPanel initialRows={tags} />}
    </div>
  )
}
