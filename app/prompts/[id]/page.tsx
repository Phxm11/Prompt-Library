import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ImageGallery from '@/app/components/ImageGallery'
import CopyPromptButton from '@/app/components/CopyPromptButton'
import StarRating from '@/app/components/StarRating'
import ReviewSection from '@/app/components/ReviewSection'
import LikeButton from '@/app/components/LikeButton'
import ViewTracker from '@/app/components/ViewTracker'
import AuthorBadge from '@/app/components/AuthorBadge'
import PromptOwnerActions from '@/app/components/PromptOwnerActions'

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('prompts')
    .select(`
      *,
      categories (name, slug),
      media_types (name, slug),
      profiles (username, display_name, avatar_url),
      prompt_examples (example_id, file_url, sort_order, position, zoom),
      prompt_ai_models (ai_models (ai_model_id, name, provider, logo_url))
    `)
    .eq('prompt_id', id)

  // ให้เห็น prompt ที่เป็น public เสมอ หรือถ้าเป็นเจ้าของก็เห็นของตัวเองได้แม้จะซ่อนไว้ (is_public = false)
  query = user ? query.or(`is_public.eq.true,user_id.eq.${user.id}`) : query.eq('is_public', true)

  const { data: prompt, error } = await query.single()

  if (error || !prompt) {
    notFound()
  }

  // การนับยอดเข้าชมย้ายไปทำที่ <ViewTracker /> ฝั่ง client
  // (โค้ดเดิมยิงจากตรงนี้แบบไม่ await ซึ่ง supabase-js จะไม่ส่ง request ออกไปเลย)

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
      {/* หน้านี้เน้นอ่านเนื้อหา ใช้เส้นทางที่ช้าที่สุดและก้อนเดียวพอ ไม่ให้ดึงสายตาไปจาก prompt */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent2/15 rounded-full blur-[120px] pointer-events-none animate-drift-c glow-blob" />

      <ViewTracker promptId={prompt.prompt_id} />


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
              coverPosition={prompt.cover_position}
              coverZoom={prompt.cover_zoom}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="animate-spring-up [animation-delay:120ms] flex gap-2 mb-3">
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

            <div className="animate-spring-up [animation-delay:170ms]">
              <PromptOwnerActions promptId={prompt.prompt_id} ownerId={prompt.user_id} />
            </div>

            <h1 className="animate-spring-up [animation-delay:220ms] section-title text-3xl font-extrabold mb-2">
              {prompt.title}
            </h1>

            <div className="animate-spring-up [animation-delay:250ms] mb-4">
              <AuthorBadge author={prompt.profiles} createdAt={prompt.created_at} />
            </div>

            {/* คะแนนเฉลี่ย */}
            <div className="animate-spring-up [animation-delay:280ms] flex items-center gap-2 mb-3">
              <StarRating value={prompt.average_rating ?? 0} readOnly size={16} />
              <span className="text-xs text-muted font-mono">
                {prompt.average_rating > 0 ? prompt.average_rating.toFixed(1) : 'ยังไม่มีคะแนน'}
                {prompt.review_count > 0 && ` · ${prompt.review_count} รีวิว`}
              </span>
            </div>

            <div className="animate-spring-up [animation-delay:330ms] flex items-center gap-4 text-xs text-faint font-mono mb-6">
              <span>👁 {prompt.view_count} ครั้งที่ดู</span>
              <LikeButton
                promptId={prompt.prompt_id}
                initialLikeCount={prompt.like_count}
                size={16}
              />
            </div>

            <div className="animate-spring-up [animation-delay:390ms] bg-surface border border-line rounded-lg p-4 mb-3">
              <p className="text-xs font-mono font-medium text-accent/80 tracking-widest mb-2 uppercase">
                Prompt
              </p>
              <p className="text-ink-soft whitespace-pre-wrap text-sm leading-relaxed">
                {prompt.prompt_text}
              </p>
            </div>

            <div className="animate-spring-up [animation-delay:450ms]">
              <CopyPromptButton
                promptId={prompt.prompt_id}
              promptText={prompt.prompt_text}
                initialCopyCount={prompt.copy_count}
              />
            </div>

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
        <div className="reveal">
          <ReviewSection promptId={prompt.prompt_id} />
        </div>
      </div>
    </div>
  )
}
