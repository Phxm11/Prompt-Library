'use client'

import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchBar from '@/app/components/SearchBar'
import Icon from '@/app/components/Icon'
import ThemeToggle, { useTheme } from '@/app/components/ThemeToggle'
import { PROFILE_UPDATED } from '@/app/components/ProfileEditor'
import { getLocalAvatar } from '@/lib/localAvatar'
import { clearProfileCache, readProfileCache, writeProfileCache } from '@/lib/profileCache'

const primaryItems = [
  { label: 'หมวดหมู่', href: '/home' },
  { label: 'ยอดนิยม', href: '/popular' },
  { label: 'รายการโปรด', href: '/favorites' },
]

const moreItems = [
  { label: 'ประเภทสื่อ', href: '/media-types' },
  { label: 'โมเดล AI', href: '/ai-models' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { isDark, toggle: toggleTheme } = useTheme()

  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<{
    username: string | null
    display_name: string | null
    avatar_url: string | null
    role: string | null
  } | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadProfile(userId: string, userEmail: string | null) {
      const { data } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, role')
        .eq('id', userId)
        .maybeSingle()
      // รูปในฐานข้อมูลมาก่อน ถ้าไม่มีค่อยใช้รูปสำรองที่เก็บไว้ในเครื่อง
      const next = {
        username: data?.username ?? null,
        display_name: data?.display_name ?? null,
        avatar_url: data?.avatar_url ?? getLocalAvatar(userId),
        role: data?.role ?? null,
      }
      setProfile(next)
      if (userEmail) writeProfileCache({ email: userEmail, ...next })
    }

    /*
      วาดจากของที่จำไว้ก่อนเลย รีเฟรชแล้วจะได้เห็นรูปเดิมทันทีแทนที่จะรอ getUser()
      ถ้าของจริงไม่ตรง (เช่นออกจากระบบไปจากอีกแท็บ) อีกไม่กี่ร้อยมิลลิวินาทีข้างล่างจะแก้ให้เอง
    */
    const cached = readProfileCache()
    if (cached) {
      // อ่าน localStorage ใน effect เท่านั้น อ่านตอน render จะไม่ตรงกับ HTML ที่ server ส่งมา (hydration error)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(cached.email)
      setProfile({
        username: cached.username,
        display_name: cached.display_name,
        avatar_url: cached.avatar_url,
        role: cached.role,
      })
      setLoadingUser(false)
    }

    supabase.auth.getUser().then((res: { data: { user: { id: string; email?: string } | null } }) => {
      const user = res.data.user
      setEmail(user?.email ?? null)
      if (user) {
        loadProfile(user.id, user.email ?? null)
      } else {
        // ของที่จำไว้ไม่ตรงกับความจริงแล้ว ทิ้งไปไม่งั้นรีเฟรชหน้าถัดไปจะโชว์รูปค้าง
        setProfile(null)
        clearProfileCache()
      }
      setLoadingUser(false)
    })

    // หน้าโปรไฟล์บันทึกเสร็จแล้วยิง event มา ให้ดึงรูป/ชื่อใหม่ทันที
    async function onProfileUpdated() {
      const { data } = await supabase.auth.getUser()
      if (data.user) loadProfile(data.user.id, data.user.email ?? null)
    }
    window.addEventListener(PROFILE_UPDATED, onProfileUpdated)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((
      _event: string,
      session: Session | null
    ) => {
      setEmail(session?.user?.email ?? null)
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? null)
      } else {
        setProfile(null)
        clearProfileCache()
      }
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
    // ล้างของที่จำไว้ทันที ไม่ต้องรอ onAuthStateChange ไม่งั้นอาจแวบเห็นรูปเดิมตอนเปลี่ยนหน้า
    clearProfileCache()
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

  /*
    ให้แต่ละแถวในเมนูผู้ใช้ไล่ขึ้นมาทีละอัน ไม่ใช่โผล่พร้อมกันทั้งแผง
    ตอนเปิดหน่วงทีละ 30ms ไล่ลงไป ตอนปิดไม่หน่วงเลย ทั้งแผงจะได้ยุบพร้อมกันเร็ว ๆ
  */
  const rowMotion = `transform-gpu ${userOpen ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`

  /*
    เขียน transition เป็น inline เพราะต้องหน่วงเฉพาะ opacity/transform เท่านั้น
    ถ้าใช้ transition-delay รวม สีตอนชี้เมาส์จะโดนหน่วงตามไปด้วย กลายเป็นเมนูที่ hover แล้วอืด
  */
  const rowDelay = (index: number) => {
    const delay = 50 + index * 30
    const move = userOpen
      ? `220ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
      : '120ms cubic-bezier(0.4,0,1,1) 0ms'
    return {
      transition: `opacity ${move}, transform ${move}, background-color 150ms ease, color 150ms ease`,
    }
  }

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

        {/*
          ช่องค้นหายืดกินพื้นที่ว่างทั้งหมดจนเกือบชนปุ่มเพิ่ม prompt
          min-w-0 จำเป็น ไม่งั้น flex item จะไม่ยอมหดต่ำกว่าความกว้างของ input ข้างใน แล้วดันของอื่นล้นแถว
          จอเล็กก็ยังอยู่ ไม่ซ่อนแล้ว แค่แคบลงตามพื้นที่ที่เหลือ
        */}
        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        {/* ฝั่งขวา: เพิ่ม prompt + auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* คนที่ล็อกอินแล้วสลับธีมได้จากในเมนูผู้ใช้ จึงไม่ต้องมีปุ่มซ้ำอีกอัน */}
          {!loadingUser && !email && <ThemeToggle />}

          <Link
            href={email ? '/prompts/new' : '/login?next=/prompts/new'}
            onClick={handleAddPromptClick}
            className="px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-mono whitespace-nowrap bg-accent2/10 text-accent2 border border-accent2/50 hover:bg-accent2/20 hover:shadow-[0_0_12px_rgba(255,62,200,0.3)] transition-all"
          >
            {/* จอเล็กเหลือแค่ + เพื่อคืนพื้นที่ให้ช่องค้นหา */}
            <span aria-hidden="true">+</span>
            <span className="hidden sm:inline"> เพิ่ม Prompt</span>
            <span className="sr-only sm:hidden">เพิ่ม Prompt</span>
          </Link>

          {/* ยังไม่รู้ว่าใครล็อกอินอยู่ กันที่ไว้ก่อนขนาดเท่ารูปโปรไฟล์ ของรอบข้างจะได้ไม่กระโดด */}
          {loadingUser && (
            <div
              aria-hidden="true"
              className="h-9 w-9 shrink-0 animate-pulse rounded-full border border-line bg-surface"
            />
          )}

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
                    ) : profile ? (
                      <span className="grid h-full w-full place-items-center bg-accent/10 font-display text-sm font-extrabold text-accent">
                        {(profile.display_name || profile.username || email)
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    ) : (
                      // ยังไม่รู้ว่ามีรูปไหม โชว์วงกลมเปล่าไปก่อน
                      // ถ้าเดาเป็นตัวอักษรย่อไว้แล้วจริง ๆ มีรูป ผู้ใช้จะเห็นของสลับกันอีกจังหวะ
                      <span className="h-full w-full animate-pulse bg-line" />
                    )}
                  </button>

                  {/*
                    เมนูอยู่ใน DOM ตลอด แล้วสลับด้วย transition แทนการ mount/unmount
                    ของเดิมใช้ animate-menu-in ซึ่งมีแต่จังหวะเข้า พอปิดคือหายวับทันที เลยรู้สึกกระตุก
                    ตอนปิดใส่ invisible ด้วย ลิงก์ข้างในจึงไม่โดน Tab ไปโฟกัสทั้งที่มองไม่เห็น

                    transform-gpu สำคัญกว่าที่คิด: เมนูอยู่ใน <header> ที่มี backdrop-blur
                    ถ้าไม่ดันขึ้น layer ของตัวเอง ทุกเฟรมที่เมนูขยับเบราว์เซอร์จะคำนวณเบลอพื้นหลังใหม่ทั้งแถบ
                    ซึ่งเป็นสาเหตุที่รู้สึกหน่วง ทั้งที่ transition เองมีแค่ opacity กับ transform

                    เข้าเร็วกว่าออกนิดหน่อย เพราะตอนกดเปิดคนรอดูผล ส่วนตอนปิดแค่ไม่ให้หายวับ
                  */}
                  <div
                    role="menu"
                    aria-hidden={!userOpen}
                    className={`absolute right-0 top-full z-50 mt-2 w-60 origin-top-right transform-gpu overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] transition-[opacity,transform,visibility] will-change-[opacity,transform] motion-reduce:transition-none ${
                      userOpen
                        ? 'visible translate-y-0 scale-100 opacity-100 duration-[260ms] ease-[cubic-bezier(0.34,1.28,0.64,1)]'
                        : 'invisible -translate-y-2 scale-[0.94] opacity-0 duration-[150ms] ease-[cubic-bezier(0.4,0,1,1)]'
                    }`}
                  >
                    <div className={`px-3 py-2.5 border-b border-line mb-1 ${rowMotion}`} style={rowDelay(0)}>
                      <p className="truncate text-sm font-semibold text-ink">
                        {profile?.display_name || 'ยังไม่ได้ตั้งชื่อเล่น'}
                      </p>
                      <p className="truncate text-xs font-mono text-faint mt-0.5">{email}</p>
                    </div>

                    {profile?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserOpen(false)}
                        style={rowDelay(1)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-mono text-accent2 hover:bg-accent2/10 ${rowMotion}`}
                      >
                        <Icon name="sparkles" size={15} />
                        จัดการระบบ (Admin)
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setUserOpen(false)}
                      style={rowDelay(2)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-mono text-ink-soft hover:bg-accent/10 hover:text-accent ${rowMotion}`}
                    >
                      <Icon name="user" size={15} />
                      โปรไฟล์ของฉัน
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setUserOpen(false)}
                      style={rowDelay(3)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-mono text-ink-soft hover:bg-accent/10 hover:text-accent ${rowMotion}`}
                    >
                      <Icon name="heart" size={15} />
                      รายการโปรด
                    </Link>

                    {/* สลับธีมในเมนูเลย ไม่ต้องปิดเมนูก่อน จะได้เห็นสีเปลี่ยนทันทีตรงหน้า */}
                    <button
                      onClick={toggleTheme}
                      style={rowDelay(4)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-mono text-ink-soft hover:bg-accent/10 hover:text-accent ${rowMotion}`}
                    >
                      {/* ไอคอนสองตัวซ้อนกัน หมุนสลับกันเหมือนปุ่มธีมบน navbar */}
                      <span className="relative grid h-[15px] w-[15px] shrink-0 place-items-center">
                        <span
                          className={`absolute transition-all duration-300 ${
                            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
                          }`}
                        >
                          <Icon name="moon" size={15} />
                        </span>
                        <span
                          className={`absolute transition-all duration-300 ${
                            isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
                          }`}
                        >
                          <Icon name="sun" size={15} />
                        </span>
                      </span>
                      {isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
                    </button>

                    <button
                      onClick={handleLogout}
                      style={rowDelay(5)}
                      className={`mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-line px-3 py-2.5 pt-3 text-left text-sm font-mono text-ink-soft hover:bg-accent2/10 hover:text-accent2 ${rowMotion}`}
                    >
                      <Icon name="log-out" size={15} />
                      ออกจากระบบ
                    </button>
                  </div>
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
