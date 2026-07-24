'use client'

import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchBar from '@/app/components/SearchBar'
import Icon from '@/app/components/Icon'

const primaryItems = [
  { label: 'หมวดหมู่', href: '/' },
  { label: 'ยอดนิยม', href: '/popular' },
  { label: 'รายการโปรด', href: '/favorites' },
]

const moreItems = [
  { label: 'ประเภทสื่อ', href: '/media-types' },
  { label: 'โมเดล AI', href: '/ai-models' },
  { label: 'ประวัติการใช้งาน', href: '/history' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then((res: { data: { user: { email?: string } | null } }) => {
      const user = res.data.user
      setEmail(user?.email ?? null)
      setLoadingUser(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((
      _event: string,
      session: Session | null
    ) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleAddPromptClick(e: React.MouseEvent) {
    if (!loadingUser && !email) {
      e.preventDefault()
      router.push('/login?next=/prompts/new')
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const linkClass = (active: boolean) =>
    `px-3.5 py-2 rounded-lg text-sm font-mono whitespace-nowrap transition-all ${
      active
        ? 'text-cyan-300 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
        : 'text-[#8888a0] hover:text-cyan-300 hover:bg-cyan-500/5'
    }`

  const navIcon = (href: string) => {
    if (href === '/') return <Icon name="home" size={14} />
    if (href === '/popular') return <Icon name="star" size={14} />
    if (href === '/favorites') return <Icon name="heart" size={14} />
    if (href === '/media-types') return <Icon name="grid" size={14} />
    if (href === '/ai-models') return <Icon name="cpu" size={14} />
    return <Icon name="clock" size={14} />
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#232336]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent shrink-0"
        >
          Prompt Library
        </Link>

        {/* เมนูหลัก */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
          {primaryItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
              <span className="flex items-center gap-1.5">{navIcon(item.href)}{item.label}</span>
            </Link>
          ))}

          {/* dropdown เมนูรอง กันไม่ให้ navbar ล้น */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={linkClass(moreItems.some((i) => isActive(i.href))) + ' flex items-center gap-1'}
            >
              เพิ่มเติม
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 rounded-lg bg-[#12121c] border border-[#232336] shadow-[0_0_24px_rgba(0,0,0,0.5)] overflow-hidden py-1">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-mono transition-colors ${
                      isActive(item.href)
                        ? 'text-cyan-300 bg-cyan-500/10'
                        : 'text-[#c8c8d4] hover:text-cyan-300 hover:bg-cyan-500/5'
                    }`}
                  >
                    <span className="flex items-center gap-2">{navIcon(item.href)}{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* ช่องค้นหา ยืดเต็มพื้นที่ว่างตรงกลาง */}
        <div className="hidden md:block flex-1 max-w-xs">
          <SearchBar compact />
        </div>

        {/* ฝั่งขวา: เพิ่ม prompt + auth */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link
            href={email ? '/prompts/new' : '/login?next=/prompts/new'}
            onClick={handleAddPromptClick}
            className="px-3.5 py-2 rounded-lg text-sm font-mono whitespace-nowrap bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/50 hover:bg-fuchsia-500/20 hover:shadow-[0_0_12px_rgba(255,62,200,0.3)] transition-all"
          >
            + เพิ่ม Prompt
          </Link>

          {!loadingUser && (
            <>
              {email ? (
                <>
                <Link
                  href="/profile"
                  className="px-3.5 py-2 rounded-lg text-sm font-mono whitespace-nowrap bg-[#12121c] text-[#c8c8d4] border border-[#232336] hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
                  title={email}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-lg text-sm font-mono whitespace-nowrap bg-[#12121c] text-[#c8c8d4] border border-[#232336] hover:border-fuchsia-400/50 hover:text-fuchsia-300 transition-all"
                  title={email}
                >
                  ออกจากระบบ
                </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-lg text-sm font-mono whitespace-nowrap bg-[#12121c] text-[#c8c8d4] border border-[#232336] hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* เมนูมือถือ: แถวที่ 2 แบบเลื่อนได้ เฉพาะจอเล็กกว่า lg */}
      <div className="lg:hidden border-t border-[#232336] px-6 py-2 flex gap-1 overflow-x-auto">
        {[...primaryItems, ...moreItems].map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
            <span className="flex items-center gap-1.5">{navIcon(item.href)}{item.label}</span>
          </Link>
        ))}
      </div>
    </header>
  )
}
