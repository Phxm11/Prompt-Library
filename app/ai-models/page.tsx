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
      <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-2 uppercase">
        // ai_models
      </p>
      <h1
        className="text-3xl font-bold mb-1 text-[#f2f2f7]"
      >
        โมเดล AI
      </h1>
      <p className="text-[#8888a0] text-sm mb-8">เลือกดู Prompt ที่ใช้ได้กับโมเดลนี้</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiModels?.map((model) => (
          <Link
            key={model.ai_model_id}
            href={`/ai-models/${model.ai_model_id}`}
            className="group p-6 rounded-xl bg-[#12121c] border border-[#232336] hover:border-fuchsia-400/60 hover:shadow-[0_0_24px_rgba(255,62,200,0.2)] transition-all flex items-center gap-4"
          >
            {model.logo_url ? (
              <img src={model.logo_url} alt="" className="w-10 h-10 rounded-lg shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 shrink-0" />
            )}
            <div>
              <h3 className="font-semibold text-[#f2f2f7] group-hover:text-fuchsia-300 transition-colors">
                {model.name}
              </h3>
              <p className="text-[#666680] text-sm font-mono">{model.provider}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}