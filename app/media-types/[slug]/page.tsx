import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/app/components/Icon'

// ใช้ชุดเดียวกับหน้า /media-types
const mediaIcons: Record<string, 'image' | 'video' | 'audio' | 'document' | 'text'> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  text: 'text',
}

export default async function MediaTypeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mediaType } = await supabase
    .from('media_types')
    .select('media_type_id, name, slug')
    .eq('slug', slug)
    .single()

  if (!mediaType) notFound()

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*, categories(name), media_types(name)')
    .eq('media_type_id', mediaType.media_type_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/media-types" className="text-sm text-accent hover:underline font-mono">
        ← กลับไปประเภทสื่อ
      </Link>

      <div className="mt-4 mb-8 flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
          <Icon name={mediaIcons[mediaType.slug] ?? 'grid'} size={24} />
        </span>
        <h1 className="section-title text-4xl font-extrabold">{mediaType.name}</h1>
      </div>

      {error && <p className="text-accent2">เกิดข้อผิดพลาด: {error.message}</p>}

      {prompts && prompts.length === 0 && (
        <p className="text-muted font-mono text-sm py-12 text-center">
          {'>'} ยังไม่มี Prompt ในประเภทสื่อนี้
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {prompts?.map((prompt, i) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} index={i} />
        ))}
      </div>
    </div>
  )
}