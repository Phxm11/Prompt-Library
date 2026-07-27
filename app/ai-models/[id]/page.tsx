import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/app/components/PromptCard'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AiModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: aiModel } = await supabase
    .from('ai_models')
    .select('ai_model_id, name, provider')
    .eq('ai_model_id', id)
    .single()

  if (!aiModel) notFound()

  // ดึง prompt ที่ผูกกับโมเดลนี้ผ่านตาราง prompt_ai_models
  // ใช้ !inner เพื่อกรองเฉพาะ prompt ที่ is_public = true ด้วย
  const { data: rows, error } = await supabase
    .from('prompt_ai_models')
    .select('prompts!inner(*, categories(name), media_types(name))')
    .eq('ai_model_id', id)
    .eq('prompts.is_public', true)

  const prompts = (rows ?? []).map((r: any) => r.prompts)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/ai-models" className="text-sm text-accent2 hover:underline font-mono">
        ← กลับไปโมเดล AI
      </Link>

      <h1
        className="section-title text-4xl font-extrabold mt-4 mb-1"
      >
        {aiModel.name}
      </h1>
      <p className="text-muted text-sm mb-8 font-mono">{aiModel.provider}</p>

      {error && <p className="text-accent2">เกิดข้อผิดพลาด: {error.message}</p>}

      {prompts.length === 0 && (
        <p className="text-muted font-mono text-sm py-12 text-center">
          {'>'} ยังไม่มี Prompt สำหรับโมเดลนี้
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {prompts.map((prompt: any, i: number) => (
          <PromptCard key={prompt.prompt_id} prompt={prompt} index={i} />
        ))}
      </div>
    </div>
  )
}