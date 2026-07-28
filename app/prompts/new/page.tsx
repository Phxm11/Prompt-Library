import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromptForm from '@/app/components/PromptForm'
import DraftList, { type Draft } from '@/app/components/DraftList'

export default async function NewPromptPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/prompts/new')
  }

  const [{ data: categories }, { data: mediaTypes }, { data: aiModels }, { data: drafts }] =
    await Promise.all([
      supabase.from('categories').select('category_id, name').eq('is_active', true).order('sort_order'),
      supabase.from('media_types').select('media_type_id, name').order('name'),
      supabase.from('ai_models').select('ai_model_id, name').eq('is_active', true).order('name'),
      // ฉบับร่างของตัวเอง เอามาให้เลือกเขียนต่อได้เลย ไม่ต้องไปตามหาในหน้าโปรไฟล์
      supabase
        .from('prompts')
        .select('prompt_id, title, cover_image_url, cover_position, updated_at, created_at')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(12),
    ])

  return (
    <div className="min-h-screen bg-base relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 'var(--grid-opacity)',
          backgroundImage:
            'linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        <h1 className="animate-spring-up section-title text-4xl font-extrabold mb-8 text-ink">
          เพิ่ม Prompt ใหม่
        </h1>

        <DraftList drafts={(drafts ?? []) as Draft[]} />

        <PromptForm
          categories={(categories ?? []).map((c) => ({ id: c.category_id, name: c.name }))}
          mediaTypes={(mediaTypes ?? []).map((m) => ({ id: m.media_type_id, name: m.name }))}
          aiModels={(aiModels ?? []).map((a) => ({ id: a.ai_model_id, name: a.name }))}
        />
      </div>
    </div>
  )
}