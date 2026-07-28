import Link from 'next/link'
import OAuthLoginButton from '@/app/components/OAuthLoginButton'

/**
 * รับเฉพาะ path ภายในเว็บเท่านั้น
 * ถ้าปล่อยให้ใส่ URL เต็มได้ จะกลายเป็นช่องโหว่ open redirect
 * (ส่งลิงก์ /login?next=https://evil.com แล้วพาเหยื่อออกไปเว็บอื่นหลังล็อกอิน)
 */
function safeNext(next?: string) {
  if (!next) return undefined
  if (!next.startsWith('/') || next.startsWith('//')) return undefined
  return next
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const next = safeNext(params.next)

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="animate-spring-up section-title section-title-center text-3xl font-extrabold mb-2">
          เข้าสู่ระบบ
        </h1>
        <p className="animate-spring-up [animation-delay:60ms] text-sm text-muted text-center mb-8">
          เข้าใช้งานด้วยบัญชีที่มีอยู่แล้ว ไม่ต้องตั้งรหัสผ่านใหม่
        </p>

        {params.error && (
          <p className="animate-spring-up [animation-delay:100ms] mb-5 rounded-lg border border-accent2/30 bg-accent2/10 px-4 py-3 text-sm text-accent2">
            เชื่อมต่อบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </p>
        )}

        <div className="space-y-3">
          <div className="animate-spring-up [animation-delay:140ms]">
            <OAuthLoginButton provider="google" next={next} />
          </div>
          <div className="animate-spring-up [animation-delay:200ms]">
            <OAuthLoginButton provider="facebook" next={next} />
          </div>
        </div>

        <p className="animate-spring-up [animation-delay:260ms] mt-6 text-center text-xs text-faint leading-relaxed">
          ถ้ายังไม่เคยใช้งาน ระบบจะสร้างบัญชีให้อัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก
        </p>

        <p className="animate-spring-up [animation-delay:320ms] mt-6 text-center">
          <Link href="/home" className="text-sm font-mono text-accent hover:text-accent-soft">
            ← กลับไปดู Prompt
          </Link>
        </p>
      </div>
    </div>
  )
}
