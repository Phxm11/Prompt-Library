'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { label: 'หมวดหมู่', href: '/' },
  { label: 'ประเภทสื่อ', href: '/media-types' },
  { label: 'โมเดล AI', href: '/ai-models' },
  { label: 'รายการโปรด', href: '/favorites' },
  { label: 'ประวัติการใช้งาน', href: '/history' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#232336]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent shrink-0"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Prompt Library
        </Link>

        <nav className="flex gap-1 overflow-x-auto">
          {menuItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-mono whitespace-nowrap transition-all ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                    : 'text-[#8888a0] hover:text-cyan-300 hover:bg-cyan-500/5'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}