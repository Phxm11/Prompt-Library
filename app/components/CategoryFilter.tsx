'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Category = {
  category_id: string
  name: string
  slug: string
}

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('category')

  function handleFilter(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        onClick={() => handleFilter(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-mono border transition-all ${
          !activeSlug
            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400 shadow-[0_0_16px_rgba(0,229,255,0.35)]'
            : 'bg-transparent text-[#8888a0] border-[#232336] hover:border-cyan-500/50 hover:text-cyan-300'
        }`}
      >
        ทั้งหมด
      </button>

      {categories.map((cat) => (
        <button
          key={cat.category_id}
          onClick={() => handleFilter(cat.slug)}
          className={`px-4 py-1.5 rounded-full text-sm font-mono border transition-all ${
            activeSlug === cat.slug
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400 shadow-[0_0_16px_rgba(0,229,255,0.35)]'
              : 'bg-transparent text-[#8888a0] border-[#232336] hover:border-cyan-500/50 hover:text-cyan-300'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}