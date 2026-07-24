import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ImageGallery from '@/app/components/ImageGallery'
import CopyPromptButton from '@/app/components/CopyPromptButton'
import StarRating from '@/app/components/StarRating'
import ReviewSection from '@/app/components/ReviewSection'
import LikeButton from '@/app/components/LikeButton'

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(`
      *,
      categories (name, slug),
      media_types (name, slug),
      prompt_examples (example_id, file_url, sort_order),
      prompt_ai_models (ai_models (ai_model_id, name, provider, logo_url))
    `)
    .eq('prompt_id', id)
    .eq('is_public', true)
    .single()

  if (error || !prompt) {
    notFound()
  }

  supabase.rpc('increment_view_count', { prompt_id_input: id })

  // บันทึก view ลง usage_history ด้วย (เพื่อให้หน้าประวัติการใช้งานมีข้อมูลจริง)
  // fire-and-forget ไม่ await เพื่อไม่ให้หน้าเว็บโหลดช้า
  supabase.auth.getUser().then(({ data: { user } }) => {
    supabase.from('usage_history').insert({
      prompt_id: id,
      user_id: user?.id ?? null,
      action_type: 'view',
    })
  })

  const sortedExamples = (prompt.prompt_examples ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

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
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-8">
        <a
          href="/"
          className="text-sm text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
        >
          ← กลับหน้ารายการ
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
          <div className="lg:col-span-3">
            <ImageGallery
              coverImageUrl={prompt.cover_image_url}
              examples={sortedExamples}
              title={prompt.title}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-3">
              {prompt.categories && (
                <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  {prompt.categories.name}
                </span>
              )}
              {prompt.media_types && (
                <span className="text-xs font-mono bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-fuchsia-400" />
                  {prompt.media_types.name}
                </span>
              )}
            </div>

            <h1
              className="text-2xl font-bold text-[#f2f2f7] mb-2"
            >
              {prompt.title}
            </h1>

            {/* คะแนนเฉลี่ย */}
            <div className="flex items-center gap-2 mb-3">
              <StarRating value={prompt.average_rating ?? 0} readOnly size={16} />
              <span className="text-xs text-[#8888a0] font-mono">
                {prompt.average_rating > 0 ? prompt.average_rating.toFixed(1) : 'ยังไม่มีคะแนน'}
                {prompt.review_count > 0 && ` · ${prompt.review_count} รีวิว`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#666680] font-mono mb-6">
              <span>👁 {prompt.view_count} ครั้งที่ดู</span>
              <LikeButton
                promptId={prompt.prompt_id}
                initialLikeCount={prompt.like_count}
                size={16}
              />
            </div>

            <div className="bg-[#12121c] border border-[#232336] rounded-lg p-4 mb-3">
              <p className="text-xs font-mono font-medium text-cyan-400/80 tracking-widest mb-2 uppercase">
                Prompt
              </p>
              <p className="text-[#e0e0e8] whitespace-pre-wrap text-sm leading-relaxed">
                {prompt.prompt_text}
              </p>
            </div>

            <CopyPromptButton
              promptId={prompt.prompt_id}
              promptText={prompt.prompt_text}
              initialCopyCount={prompt.copy_count}
            />

            {prompt.negative_prompt && (
              <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-lg p-4 mt-4">
                <p className="text-xs font-mono font-medium text-fuchsia-400/80 tracking-widest mb-2 uppercase">
                  Negative Prompt
                </p>
                <p className="text-[#c8c8d4] whitespace-pre-wrap text-sm">
                  {prompt.negative_prompt}
                </p>
              </div>
            )}

            {prompt.description && (
              <div className="mt-6">
                <p className="text-xs font-mono font-medium text-[#666680] tracking-widest mb-2 uppercase">
                  คำอธิบาย
                </p>
                <p className="text-[#c8c8d4] text-sm leading-relaxed">{prompt.description}</p>
              </div>
            )}

            {prompt.prompt_ai_models && prompt.prompt_ai_models.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-mono font-medium text-[#666680] tracking-widest mb-2 uppercase">
                  ใช้ได้กับโมเดล
                </p>
                <div className="flex flex-wrap gap-2">
                  {prompt.prompt_ai_models.map((item: any) => (
                    <span
                      key={item.ai_models.ai_model_id}
                      className="text-sm font-mono bg-[#12121c] border border-[#232336] text-[#c8c8d4] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:border-cyan-500/40 transition-colors"
                    >
                      {item.ai_models.logo_url && (
                        <img
                          src={item.ai_models.logo_url}
                          alt=""
                          className="w-4 h-4 rounded"
                        />
                      )}
                      {item.ai_models.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ระบบ Rating/Comment */}
        <ReviewSection promptId={prompt.prompt_id} />
      </div>
    </div>
  )
}