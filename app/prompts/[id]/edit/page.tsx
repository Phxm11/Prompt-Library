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

  const [{ data: categories }, { data: mediaTypes }, { data: aiModels }] = await Promise.all([
    supabase.from('categories').select('category_id, name').eq('is_active', true).order('sort_order'),
    supabase.from('media_types').select('media_type_id, name').order('name'),
    supabase.from('ai_models').select('ai_model_id, name').eq('is_active', true).order('name'),
  ])

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(`
      *,
      prompt_examples (example_id, file_url),
      prompt_ai_models (ai_model_id)
    `)
    .eq('prompt_id', id)
    .single()

  if (error || !prompt) notFound()

  // กันคนอื่นแก้ prompt ที่ไม่ใช่ของตัวเอง แม้จะเดา URL ถูกก็ตาม
  if (prompt.user_id !== user.id) {
    redirect(`/prompts/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
          // edit_prompt
        </p>
        <h1
          className="text-3xl font-bold mb-8 text-[#f2f2f7]"
        >
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
            is_public: prompt.is_public,
            selectedAiModelIds: (prompt.prompt_ai_models ?? []).map((m: any) => m.ai_model_id),
            existingExamples: prompt.prompt_examples ?? [],
          }}
        />
      </div>
    </div>
  )
}