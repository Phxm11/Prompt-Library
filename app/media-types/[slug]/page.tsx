import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import EmptyState from '@/app/components/EmptyState'
import ErrorState from '@/app/components/ErrorState'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: mediaType } = await supabase
    .from('media_types')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!mediaType) return { title: 'ไม่พบประเภทสื่อนี้' }

  const title = `Prompt สำหรับ${mediaType.name}`
  return {
    title,
    description: `รวม Prompt AI ประเภท${mediaType.name} ทั้งหมด คัดลอกไปใช้งานได้ทันที`,
    alternates: { canonical: `/media-types/${slug}` },
  }
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

      {error && <ErrorState message={error.message} className="mb-8" />}

      {!error && prompts && prompts.length === 0 && (
        <EmptyState
          icon={mediaIcons[mediaType.slug] ?? 'grid'}
          title="ยังไม่มี Prompt ในประเภทสื่อนี้"
          description="ลองดูประเภทสื่ออื่น หรือเลือกดู prompt ทั้งหมด"
          action={{ label: 'ดู Prompt ทั้งหมด', href: '/home' }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {prompts?.map((prompt, i) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} index={i} />
        ))}
      </div>
    </div>
  )
}