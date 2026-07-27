import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromptForm from '@/app/components/PromptForm'

export default async function NewPromptPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/prompts/new')
  }

  const [{ data: categories }, { data: mediaTypes }, { data: aiModels }] = await Promise.all([
    supabase.from('categories').select('category_id, name').eq('is_active', true).order('sort_order'),
    supabase.from('media_types').select('media_type_id, name').order('name'),
    supabase.from('ai_models').select('ai_model_id, name').eq('is_active', true).order('name'),
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
        <h1 className="section-title text-4xl font-extrabold mb-8 text-ink">
          เพิ่ม Prompt ใหม่
        </h1>

        <PromptForm
          categories={(categories ?? []).map((c) => ({ id: c.category_id, name: c.name }))}
          mediaTypes={(mediaTypes ?? []).map((m) => ({ id: m.media_type_id, name: m.name }))}
          aiModels={(aiModels ?? []).map((a) => ({ id: a.ai_model_id, name: a.name }))}
        />
      </div>
    </div>
  )
}