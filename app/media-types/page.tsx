import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MediaTypesPage() {
  const supabase = await createClient()

  const { data: mediaTypes } = await supabase
    .from('media_types')
    .select('media_type_id, name, slug')
    .order('name')

  // นับจำนวน prompt ในแต่ละประเภทสื่อ
  const { data: counts } = await supabase
    .from('prompts')
    .select('media_type_id')
    .eq('is_public', true)

  const countMap = (counts ?? []).reduce((acc: Record<string, number>, p) => {
    acc[p.media_type_id] = (acc[p.media_type_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // media_types
      </p>
      <h1
        className="text-3xl font-bold mb-1 text-[#f2f2f7]"
      >
        ประเภทสื่อ
      </h1>
      <p className="text-[#8888a0] text-sm mb-8">เลือกดู Prompt ตามรูปแบบผลลัพธ์ที่ต้องการ</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaTypes?.map((mt) => (
          <Link
            key={mt.media_type_id}
            href={`/media-types/${mt.slug}`}
            className="group p-6 rounded-xl bg-[#12121c] border border-[#232336] hover:border-cyan-400/60 hover:shadow-[0_0_24px_rgba(0,229,255,0.2)] transition-all"
          >
            <h3 className="font-semibold text-lg text-[#f2f2f7] group-hover:text-cyan-300 transition-colors">
              {mt.name}
            </h3>
            <p className="text-[#666680] text-sm font-mono mt-1">
              {countMap[mt.media_type_id] ?? 0} prompts
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}