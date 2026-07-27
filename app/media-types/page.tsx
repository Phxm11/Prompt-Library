import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Icon from '@/app/components/Icon'

// ผูกไอคอนกับ slug ของประเภทสื่อ ถ้ามีประเภทใหม่ที่ยังไม่ได้แมป จะใช้ 'grid' แทน
const mediaIcons: Record<string, 'image' | 'video' | 'audio' | 'document' | 'text'> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  text: 'text',
}

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
      <h1 className="animate-spring-up section-title text-4xl font-extrabold mb-1 text-ink">
        ประเภทสื่อ
      </h1>
      <p className="animate-spring-up [animation-delay:60ms] text-muted text-sm mb-8">
        เลือกดู Prompt ตามรูปแบบผลลัพธ์ที่ต้องการ
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaTypes?.map((mt, i) => (
          <Link
            key={mt.media_type_id}
            href={`/media-types/${mt.slug}`}
            style={{ animationDelay: `${120 + Math.min(i, 12) * 55}ms` }}
            className="animate-spring-up group p-6 rounded-xl bg-surface border border-line hover:border-accent/60 hover:shadow-[0_10px_30px_-10px_color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-1 transition-[translate,box-shadow,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <div className="flex items-center gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-colors group-hover:border-accent/60 group-hover:bg-accent/15">
                <Icon name={mediaIcons[mt.slug] ?? 'grid'} size={21} />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-ink group-hover:text-accent transition-colors truncate">
                  {mt.name}
                </h3>
                <p className="text-faint text-sm font-mono mt-0.5">
                  {countMap[mt.media_type_id] ?? 0} prompts
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}