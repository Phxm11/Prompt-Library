import Link from 'next/link'
import Image from 'next/image'
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
    { label: 'prompt', value: promptCount ?? 0, icon: 'sparkles' as const, color: 'accent' as const },
    { label: 'หมวดหมู่', value: categoryCount ?? 0, icon: 'grid' as const, color: 'accent2' as const },
    { label: 'ประเภทสื่อ', value: mediaTypeCount ?? 0, icon: 'image' as const, color: 'accent' as const },
    { label: 'โมเดล AI', value: aiModelCount ?? 0, icon: 'cpu' as const, color: 'accent2' as const },
  ]

  const steps = [
    { no: '01', icon: 'search' as const, title: 'ค้นหา', desc: 'กรองตามหมวดหมู่ ประเภทสื่อ หรือโมเดล AI ที่คุณใช้อยู่' },
    { no: '02', icon: 'copy' as const, title: 'คัดลอก', desc: 'กดปุ่มเดียวได้ prompt เต็ม ๆ พร้อมวางใช้งานทันที ไม่ต้องล็อกอิน' },
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
      {/*
        ก้อนแสงสี่ก้อน แต่ละก้อนใช้เส้นทางลอยคนละเส้น (drift-a/b/c ใน globals.css)
        คู่ที่ใช้เส้นทางซ้ำกันหน่วงเวลาต่างกันมาก ๆ จะได้ไม่ขยับพร้อมกันจนดูเป็นลูป
        ทั้งหมดเป็น transform + opacity ล้วน ก้อนเบลอ 130px จึงลอยได้โดยไม่กินแรงเครื่อง
      */}
      <div className="absolute -top-48 -left-40 w-[32rem] h-[32rem] bg-accent/20 rounded-full blur-[130px] pointer-events-none animate-drift-a glow-blob" />
      <div className="absolute -top-32 -right-40 w-[32rem] h-[32rem] bg-accent2/20 rounded-full blur-[130px] pointer-events-none animate-drift-b glow-blob" />
      <div className="absolute top-[55%] left-1/4 w-[28rem] h-[28rem] bg-accent/10 rounded-full blur-[140px] pointer-events-none animate-drift-c glow-blob" />
      <div className="absolute top-[70%] -right-24 w-[26rem] h-[26rem] bg-accent2/10 rounded-full blur-[150px] pointer-events-none animate-drift-a [animation-duration:15s] [animation-delay:-7s] glow-blob" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* ── BANNER ───────────────────────────────────────────── */}
        <section className="pt-10">
          <div className="animate-spring-up relative overflow-hidden rounded-2xl border border-accent/30 shadow-[0_0_40px_rgba(103,232,249,0.15)]">
            <Image
              src="/images/hero-banner.jpg"
              alt="Prompt Library — คลัง Prompt AI ภาษาไทย สำหรับสร้างรูปภาพ วิดีโอ และงานนำเสนอ"
              width={1730}
              height={742}
              priority
              className="w-full h-auto object-cover"
            />
          </div>
        </section>

        {/* ── ต่อจาก banner: ช่องค้นหา + ปุ่ม + ตัวเลขสรุป ────────── */}
        {/*
          banner มีหัวข้อ คำโปรย และ badge "PROMPT LIBRARY" ของตัวเองอยู่แล้ว (เป็นภาพ)
          ส่วนนี้จึงไม่พูดซ้ำสิ่งที่ banner บอกไปแล้ว แค่ทำหน้าที่ต่อ: ให้กดค้นหา/เริ่มใช้ได้ทันที
          การ์ดใช้พื้นผิวโปร่งแสง+เบลอเบา ๆ ไม่ใช่กระจกเข้มแบบ navbar เพราะอยู่ติดกับ banner ที่โทนสว่างนวล
        */}
        <section className="pt-8 pb-20 text-center">
          <div className="animate-spring-up [animation-delay:120ms] max-w-xl mx-auto">
            <SearchBar />
          </div>

          <div className="animate-spring-up [animation-delay:220ms] mt-5 flex flex-wrap items-center justify-center gap-3">
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

          {/* ตัวเลขสรุป — การ์ดแยกทีละอัน มีไอคอนกำกับ + ตัวเลขไล่สีเรืองแสงแบบเดียวกับหัวข้อ section ทั้งเว็บ */}
          <div className="animate-spring-up [animation-delay:320ms] mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {stats.map((stat) => {
              const isAccent = stat.color === 'accent'
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-xl border border-line bg-surface/80 px-4 py-4 text-left hover:border-accent/40 transition-colors"
                >
                  {/* เรืองแสงมุมการ์ด จาง ๆ ตลอดเวลา แล้วเข้มขึ้นตอน hover ให้รู้สึกอินเตอร์แอกทีฟ */}
                  <div
                    className={`pointer-events-none absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity ${
                      isAccent ? 'bg-accent' : 'bg-accent2'
                    }`}
                  />
                  <span
                    className={`relative inline-flex w-9 h-9 rounded-lg items-center justify-center mb-2.5 border ${
                      isAccent
                        ? 'bg-accent/10 border-accent/40 text-accent'
                        : 'bg-accent2/10 border-accent2/40 text-accent2'
                    }`}
                  >
                    <Icon name={stat.icon} size={16} />
                  </span>
                  <p
                    className={`relative font-mono text-2xl font-extrabold bg-clip-text text-transparent ${
                      isAccent
                        ? 'bg-gradient-to-r from-accent to-accent-soft drop-shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_40%,transparent)]'
                        : 'bg-gradient-to-r from-accent2 to-accent-soft drop-shadow-[0_0_10px_color-mix(in_srgb,var(--accent2)_40%,transparent)]'
                    }`}
                  >
                    {stat.value.toLocaleString('th-TH')}
                  </p>
                  <p className="relative text-[11px] text-muted mt-0.5">{stat.label}</p>
                </div>
              )
            })}
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

          {/* เส้นเชื่อมแนวนอนระหว่างการ์ด สื่อว่านี่คือลำดับที่ต้องทำต่อกัน ไม่ใช่แค่ลิสต์ 3 หัวข้อ */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              className="hidden md:block absolute top-[2.75rem] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-accent/40 via-line to-accent2/40"
              aria-hidden="true"
            />
            {steps.map((step) => (
              <div
                key={step.no}
                className="relative rounded-xl border border-line bg-surface/70 p-6 hover:border-accent/40 hover:shadow-[0_0_24px_rgba(0,229,255,0.12)] transition-all"
              >
                <span className="absolute top-4 right-5 text-3xl font-bold font-mono text-line">
                  {step.no}
                </span>
                <span className="relative inline-flex w-11 h-11 rounded-lg items-center justify-center bg-accent/10 border border-accent/40 text-accent mb-4">
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