import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/app/components/SearchBar'
import PromptCard from '@/app/components/PromptCard'
import Icon from '@/app/components/Icon'

// หน้า Hero (landing) — หน้ารายการ prompt ย้ายไปอยู่ที่ /home แล้ว
export default async function LandingPage() {
  const supabase = await createClient()

  const [
    { count: promptCount },
    { count: categoryCount },
    { count: mediaTypeCount },
    { count: aiModelCount },
    { data: categories },
    { data: featured },
  ] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('media_types').select('*', { count: 'exact', head: true }),
    supabase.from('ai_models').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('categories')
      .select('category_id, name, slug')
      .eq('is_active', true)
      .order('sort_order')
      .limit(8),
    supabase
      .from('prompts')
      .select('*, categories(name), media_types(name)')
      .eq('is_public', true)
      .order('view_count', { ascending: false })
      .limit(3),
  ])

  const stats = [
    { label: 'prompts', value: promptCount ?? 0, icon: 'sparkles' as const, color: 'text-accent' },
    { label: 'categories', value: categoryCount ?? 0, icon: 'grid' as const, color: 'text-accent2' },
    { label: 'media_types', value: mediaTypeCount ?? 0, icon: 'eye' as const, color: 'text-accent' },
    { label: 'ai_models', value: aiModelCount ?? 0, icon: 'cpu' as const, color: 'text-accent2' },
  ]

  const steps = [
    { no: '01', icon: 'search' as const, title: 'ค้นหา', desc: 'กรองตามหมวดหมู่ ประเภทสื่อ หรือโมเดล AI ที่คุณใช้อยู่' },
    { no: '02', icon: 'copy' as const, title: 'คัดลอก', desc: 'กดปุ่มเดียวได้ prompt เต็ม ๆ พร้อมวางใช้งานทันที' },
    { no: '03', icon: 'heart' as const, title: 'เก็บไว้ใช้', desc: 'บันทึกเป็นรายการโปรด แล้วกลับมาหยิบใช้ได้ทุกเมื่อ' },
  ]

  return (
    <div className="min-h-screen bg-base relative overflow-hidden">
      {/* พื้นหลังตารางเรืองแสง + แสงฟุ้งมุมจอ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 'var(--grid-opacity)',
          backgroundImage:
            'linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute -top-48 -left-40 w-[32rem] h-[32rem] bg-accent/20 rounded-full blur-[130px] pointer-events-none animate-float glow-blob" />
      <div className="absolute -top-32 -right-40 w-[32rem] h-[32rem] bg-accent2/20 rounded-full blur-[130px] pointer-events-none animate-float [animation-duration:7s] [animation-delay:1.5s] glow-blob" />
      <div className="absolute top-[60%] left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-[140px] pointer-events-none animate-float [animation-duration:8s] [animation-delay:3s] glow-blob" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="pt-20 pb-16 text-center">
          <span className="animate-spring-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-[0.2em] uppercase text-accent bg-accent/10 border border-accent/40 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
            <Icon name="sparkles" size={13} />
            Prompt Library
          </span>

          <h1 className="animate-spring-up [animation-delay:150ms] mt-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight leading-[1.05] bg-gradient-to-r from-accent via-accent-soft to-accent2 bg-clip-text text-transparent">
            Prompt Library
          </h1>

          <p className="animate-spring-up [animation-delay:300ms] mt-5 text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
            คลัง Prompt AI ภาษาไทย สำหรับสร้าง{' '}
            <span className="text-accent">รูปภาพ</span>{' '}
            <span className="text-accent2">วิดีโอ</span> และ{' '}
            <span className="text-accent">งานนำเสนอ</span>
          </p>
          <p className="animate-spring-up [animation-delay:450ms] mt-2 text-sm text-muted">
            คัดลอกไปใช้ได้ทันที ไม่ต้องเขียนเองตั้งแต่ศูนย์
          </p>

          <div className="animate-spring-up [animation-delay:600ms] mt-8 max-w-xl mx-auto">
            <SearchBar />
          </div>

          <div className="animate-spring-up [animation-delay:750ms] mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/home"
              className="group px-6 py-3 rounded-lg font-mono text-sm bg-accent/15 text-accent-soft border border-accent/60 hover:bg-accent/25 hover:shadow-[0_0_24px_rgba(0,229,255,0.35)] transition-all flex items-center gap-2"
            >
              เริ่มเลือก Prompt
              <span className="group-hover:translate-x-0.5 transition-transform">
                <Icon name="arrow-right" size={15} />
              </span>
            </Link>
            <Link
              href="/popular"
              className="px-6 py-3 rounded-lg font-mono text-sm bg-surface text-ink-soft border border-line hover:border-accent2/60 hover:text-accent2 transition-all flex items-center gap-2"
            >
              <Icon name="star" size={15} />
              ดูอันดับยอดนิยม
            </Link>
          </div>

          {/* ตัวเลขสรุป */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                style={{ animationDelay: `${900 + i * 100}ms` }}
                className="animate-spring-up rounded-xl border border-line bg-surface/70 backdrop-blur px-4 py-5 hover:border-accent/40 transition-colors"
              >
                <Icon name={stat.icon} size={18} className={`${stat.color} mx-auto mb-2`} />
                <p className={`text-3xl font-bold font-mono ${stat.color}`}>
                  {stat.value.toLocaleString('th-TH')}
                </p>
                <p className="text-[10px] tracking-[0.2em] text-faint font-mono uppercase mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── หมวดหมู่ยอดฮิต ───────────────────────────────────── */}
        {(categories ?? []).length > 0 && (
          <section className="reveal pb-16">
            <h2 className="section-title section-title-center text-2xl font-extrabold text-ink mb-5">
              เลือกตามหมวดหมู่
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {(categories ?? []).map((cat) => (
                <Link
                  key={cat.category_id}
                  href={`/home?category=${cat.slug}`}
                  className="px-4 py-1.5 rounded-full text-sm font-mono border border-line text-muted hover:border-accent hover:text-accent hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-all"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/home"
                className="px-4 py-1.5 rounded-full text-sm font-mono border border-accent2/50 text-accent2 hover:bg-accent2/10 transition-all"
              >
                ทั้งหมด →
              </Link>
            </div>
          </section>
        )}

        {/* ── Prompt แนะนำ ─────────────────────────────────────── */}
        {(featured ?? []).length > 0 && (
          <section className="reveal pb-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="section-title text-3xl font-extrabold text-ink">Prompt มาแรง</h2>
              </div>
              <Link
                href="/home"
                className="text-sm font-mono text-accent hover:text-accent-soft flex items-center gap-1 shrink-0"
              >
                ดูทั้งหมด
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(featured ?? []).map((prompt, i) => (
                <PromptCard key={prompt.prompt_id} prompt={prompt} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── วิธีใช้งาน ────────────────────────────────────────── */}
        <section className="reveal pb-16">
          <h2 className="section-title section-title-center text-3xl font-extrabold text-ink mb-8">
            ใช้งานได้ใน 3 ขั้นตอน
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step) => (
              <div
                key={step.no}
                className="relative rounded-xl border border-line bg-surface/70 p-6 hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,229,255,0.12)] transition-all"
              >
                <span className="absolute top-4 right-5 text-3xl font-bold font-mono text-line">
                  {step.no}
                </span>
                <span className="inline-flex w-11 h-11 rounded-lg items-center justify-center bg-accent/10 border border-accent/40 text-accent mb-4">
                  <Icon name={step.icon} size={20} />
                </span>
                <h3 className="text-lg font-semibold text-ink mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ปิดท้าย ──────────────────────────────────────────── */}
        <section className="reveal pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface/80 px-6 py-12 text-center">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-accent2/20 blur-[90px] pointer-events-none" />
            <h2 className="section-title section-title-center relative text-2xl sm:text-3xl font-extrabold mb-3">
              มี Prompt เด็ด ๆ อยู่ในมือ?
            </h2>
            <p className="relative text-sm text-muted mb-7">
              แบ่งปันให้คนอื่นใช้ต่อ แล้วดูสถิติว่าถูกคัดลอกไปกี่ครั้ง
            </p>
            <div className="relative flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/prompts/new"
                className="px-6 py-3 rounded-lg font-mono text-sm bg-accent2/15 text-accent2 border border-accent2/60 hover:bg-accent2/25 hover:shadow-[0_0_24px_rgba(255,62,200,0.3)] transition-all flex items-center gap-2"
              >
                <Icon name="plus" size={15} />
                เพิ่ม Prompt ของคุณ
              </Link>
              <Link
                href="/home"
                className="px-6 py-3 rounded-lg font-mono text-sm bg-base text-ink-soft border border-line hover:border-accent/60 hover:text-accent transition-all"
              >
                เลือกดู Prompt ทั้งหมด
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
