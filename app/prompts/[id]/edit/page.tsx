import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PromptForm from '@/app/components/PromptForm'

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/prompts/${id}/edit`)
  }

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(
      `
      *,
      prompt_examples (example_id, file_url, sort_order, position, zoom),
      prompt_ai_models (ai_model_id)
    `
    )
    .eq('prompt_id', id)
    .single()

  if (error || !prompt) {
    notFound()
  }

  // ตรวจสิทธิ์: ต้องเป็นเจ้าของ prompt หรือแอดมินเท่านั้น
  const isOwner = user.id === prompt.user_id
  let isAdmin = false
  if (!isOwner) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  if (!isOwner && !isAdmin) {
    redirect(`/prompts/${id}`)
  }

  const [{ data: categories }, { data: mediaTypes }, { data: aiModels }] = await Promise.all([
    supabase.from('categories').select('category_id, name').eq('is_active', true).order('sort_order'),
    supabase.from('media_types').select('media_type_id, name').order('name'),
    supabase.from('ai_models').select('ai_model_id, name').eq('is_active', true).order('name'),
  ])

  const sortedExamples = (prompt.prompt_examples ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

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
          แก้ไข Prompt
        </h1>

        <PromptForm
          categories={(categories ?? []).map((c) => ({ id: c.category_id, name: c.name }))}
          mediaTypes={(mediaTypes ?? []).map((m) => ({ id: m.media_type_id, name: m.name }))}
          aiModels={(aiModels ?? []).map((a) => ({ id: a.ai_model_id, name: a.name }))}
          promptId={prompt.prompt_id}
          initialData={{
            title: prompt.title,
            prompt_text: prompt.prompt_text,
            negative_prompt: prompt.negative_prompt,
            description: prompt.description,
            category_id: prompt.category_id,
            media_type_id: prompt.media_type_id,
            cover_image_url: prompt.cover_image_url,
            cover_position: prompt.cover_position,
            cover_zoom: prompt.cover_zoom,
            status: prompt.status,
            is_public: prompt.is_public,
            selectedAiModelIds: (prompt.prompt_ai_models ?? []).map(
              (m: { ai_model_id: string }) => m.ai_model_id
            ),
            existingExamples: sortedExamples.map(
              (ex: { example_id: string; file_url: string; position?: string; zoom?: number }) => ({
                example_id: ex.example_id,
                file_url: ex.file_url,
                position: ex.position,
                zoom: ex.zoom,
              })
            ),
          }}
        />
      </div>
    </div>
  )
}
