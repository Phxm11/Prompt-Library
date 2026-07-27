import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AiModelsPage() {
  const supabase = await createClient()

  const { data: aiModels } = await supabase
    .from('ai_models')
    .select('ai_model_id, name, provider, logo_url')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="animate-spring-up section-title text-4xl font-extrabold mb-1 text-ink">
        โมเดล AI
      </h1>
      <p className="animate-spring-up [animation-delay:60ms] text-muted text-sm mb-8">
        เลือกดู Prompt ที่ใช้ได้กับโมเดลนี้
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiModels?.map((model, i) => (
          <Link
            key={model.ai_model_id}
            href={`/ai-models/${model.ai_model_id}`}
            style={{ animationDelay: `${120 + Math.min(i, 12) * 55}ms` }}
            className="animate-spring-up group p-6 rounded-xl bg-surface border border-line hover:border-accent2/60 hover:shadow-[0_10px_30px_-10px_color-mix(in_srgb,var(--accent-2)_45%,transparent)] hover:-translate-y-1 transition-[translate,box-shadow,border-color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center gap-4"
          >
            {model.logo_url ? (
              <img src={model.logo_url} alt="" className="w-10 h-10 rounded-lg shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-accent2/10 border border-accent2/30 shrink-0" />
            )}
            <div>
              <h3 className="font-semibold text-ink group-hover:text-accent2 transition-colors">
                {model.name}
              </h3>
              <p className="text-faint text-sm font-mono">{model.provider}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}