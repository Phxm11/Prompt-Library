import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent2/15 rounded-full blur-[120px] pointer-events-none glow-blob" />

      <div className="relative max-w-5xl mx-auto px-6 py-8">
        <Link
          href="/home"
          className="animate-spring-up inline-block text-sm text-accent hover:text-accent font-mono transition-colors"
        >
          ← กลับหน้ารายการ
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-4">
          <div className="animate-spring-up [animation-delay:60ms] lg:col-span-3">
            <ImageGallery
              coverImageUrl={prompt.cover_image_url}
              examples={sortedExamples}
              title={prompt.title}
              transitionName={`prompt-cover-${prompt.prompt_id}`}
            />
          </div>

          <div className="animate-spring-up [animation-delay:120ms] lg:col-span-2">
            <div className="flex gap-2 mb-3">
              {prompt.categories && (
                <span className="text-xs font-mono bg-accent/10 text-accent border border-accent/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  {prompt.categories.name}
                </span>
              )}
              {prompt.media_types && (
                <span className="text-xs font-mono bg-accent2/10 text-accent2 border border-accent2/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-accent2" />
                  {prompt.media_types.name}
                </span>
              )}
            </div>

            <h1
              className="section-title text-3xl font-extrabold mb-2"
            >
              {prompt.title}
            </h1>

            {/* คะแนนเฉลี่ย */}
            <div className="flex items-center gap-2 mb-3">
              <StarRating value={prompt.average_rating ?? 0} readOnly size={16} />
              <span className="text-xs text-muted font-mono">
                {prompt.average_rating > 0 ? prompt.average_rating.toFixed(1) : 'ยังไม่มีคะแนน'}
                {prompt.review_count > 0 && ` · ${prompt.review_count} รีวิว`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-faint font-mono mb-6">
              <span>👁 {prompt.view_count} ครั้งที่ดู</span>
              <LikeButton
                promptId={prompt.prompt_id}
                initialLikeCount={prompt.like_count}
                size={16}
              />
            </div>

            <div className="bg-surface border border-line rounded-lg p-4 mb-3">
              <p className="text-xs font-mono font-medium text-accent/80 tracking-widest mb-2 uppercase">
                Prompt
              </p>
              <p className="text-ink-soft whitespace-pre-wrap text-sm leading-relaxed">
                {prompt.prompt_text}
              </p>
            </div>

            <CopyPromptButton
              promptId={prompt.prompt_id}
              promptText={prompt.prompt_text}
              initialCopyCount={prompt.copy_count}
            />

            {prompt.negative_prompt && (
              <div className="bg-accent2/5 border border-accent2/20 rounded-lg p-4 mt-4">
                <p className="text-xs font-mono font-medium text-accent2/80 tracking-widest mb-2 uppercase">
                  Negative Prompt
                </p>
                <p className="text-ink-soft whitespace-pre-wrap text-sm">
                  {prompt.negative_prompt}
                </p>
              </div>
            )}

            {prompt.description && (
              <div className="mt-6">
                <p className="text-xs font-mono font-medium text-faint tracking-widest mb-2 uppercase">
                  คำอธิบาย
                </p>
                <p className="text-ink-soft text-sm leading-relaxed">{prompt.description}</p>
              </div>
            )}

            {prompt.prompt_ai_models && prompt.prompt_ai_models.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-mono font-medium text-faint tracking-widest mb-2 uppercase">
                  ใช้ได้กับโมเดล
                </p>
                <div className="flex flex-wrap gap-2">
                  {prompt.prompt_ai_models.map((item: any) => (
                    <span
                      key={item.ai_models.ai_model_id}
                      className="text-sm font-mono bg-surface border border-line text-ink-soft px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:border-accent/40 transition-colors"
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