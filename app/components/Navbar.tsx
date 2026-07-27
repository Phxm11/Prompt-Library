'use client'

import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchBar from '@/app/components/SearchBar'
import Icon from '@/app/components/Icon'
import ThemeToggle from '@/app/components/ThemeToggle'
import { PROFILE_UPDATED } from '@/app/components/ProfileEditor'
import { getLocalAvatar } from '@/lib/localAvatar'

const primaryItems = [
  { label: 'หมวดหมู่', href: '/home' },
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
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle()
      // รูปในฐานข้อมูลมาก่อน ถ้าไม่มีค่อยใช้รูปสำรองที่เก็บไว้ในเครื่อง
      setProfile({
        display_name: data?.display_name ?? null,
        avatar_url: data?.avatar_url ?? getLocalAvatar(userId),
      })
    }

    supabase.auth.getUser().then((res: { data: { user: { id: string; email?: string } | null } }) => {
      const user = res.data.user
      setEmail(user?.email ?? null)
      if (user) loadProfile(user.id)
      setLoadingUser(false)
    })

    // หน้าโปรไฟล์บันทึกเสร็จแล้วยิง event มา ให้ดึงรูป/ชื่อใหม่ทันที
    async function onProfileUpdated() {
      const { data } = await supabase.auth.getUser()
      if (data.user) loadProfile(data.user.id)
    }
    window.addEventListener(PROFILE_UPDATED, onProfileUpdated)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((
      _event: string,
      session: Session | null
    ) => {
      setEmail(session?.user?.email ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener(PROFILE_UPDATED, onProfileUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (moreRef.current && !moreRef.current.contains(target)) setMoreOpen(false)
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // เปลี่ยนหน้าแล้วต้องปิดเมนู ไม่งั้นมันค้างเปิดคาไว้บนหน้าใหม่
  useEffect(() => {
    setUserOpen(false)
    setMoreOpen(false)
  }, [pathname])

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
        ? 'text-accent bg-accent/10 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
        : 'text-muted hover:text-accent hover:bg-accent/5'
    }`

  const navIcon = (href: string) => {
    if (href === '/home') return <Icon name="home" size={14} />
    if (href === '/popular') return <Icon name="star" size={14} />
    if (href === '/favorites') return <Icon name="heart" size={14} />
    if (href === '/media-types') return <Icon name="grid" size={14} />
    if (href === '/ai-models') return <Icon name="cpu" size={14} />
    return <Icon name="clock" size={14} />
  }

  return (
    <header className="sticky top-0 z-50 bg-base/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="text-base sm:text-lg font-bold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent shrink-0"
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
              <div className="absolute top-full left-0 mt-2 w-44 rounded-lg bg-surface border border-line shadow-[0_0_24px_rgba(0,0,0,0.5)] overflow-hidden py-1">
                {moreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-mono transition-colors ${
                      isActive(item.href)
                        ? 'text-accent bg-accent/10'
                        : 'text-ink-soft hover:text-accent hover:bg-accent/5'
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
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          <ThemeToggle />

          <Link
            href={email ? '/prompts/new' : '/login?next=/prompts/new'}
            onClick={handleAddPromptClick}
            className="px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-mono whitespace-nowrap bg-accent2/10 text-accent2 border border-accent2/50 hover:bg-accent2/20 hover:shadow-[0_0_12px_rgba(255,62,200,0.3)] transition-all"
          >
            + เพิ่ม Prompt
          </Link>

          {!loadingUser && (
            <>
              {email ? (
                <div className="relative" ref={userRef}>
                  {/* รูปโปรไฟล์วงกลม กดแล้วกางเมนู */}
                  <button
                    onClick={() => setUserOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={userOpen}
                    aria-label="เมนูบัญชีผู้ใช้"
                    title={email}
                    className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border transition-all ${
                      userOpen
                        ? 'border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]'
                        : 'border-line hover:border-accent/60'
                    }`}
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-accent/10 font-display text-sm font-extrabold text-accent">
                        {(profile?.display_name || email).trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>

                  {userOpen && (
                    <div className="animate-menu-in absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]">
                      <div className="px-3 py-2.5 border-b border-line mb-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {profile?.display_name || 'ยังไม่ได้ตั้งชื่อเล่น'}
                        </p>
                        <p className="truncate text-xs font-mono text-faint mt-0.5">{email}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-mono text-ink-soft transition-colors hover:bg-accent/10 hover:text-accent"
                      >
                        <Icon name="user" size={15} />
                        โปรไฟล์ของฉัน
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-mono text-ink-soft transition-colors hover:bg-accent2/10 hover:text-accent2"
                      >
                        <Icon name="log-out" size={15} />
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-mono whitespace-nowrap bg-surface text-ink-soft border border-line hover:border-accent/50 hover:text-accent transition-all"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* เมนูมือถือ: แถวที่ 2 แบบเลื่อนได้ เฉพาะจอเล็กกว่า lg */}
      <div className="lg:hidden border-t border-line px-6 py-2 flex gap-1 overflow-x-auto">
        {[...primaryItems, ...moreItems].map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
            <span className="flex items-center gap-1.5">{navIcon(item.href)}{item.label}</span>
          </Link>
        ))}
      </div>
    </header>
  )
}
