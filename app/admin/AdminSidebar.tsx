'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'ภาพรวม', href: '/admin' },
  { label: 'จัดการ Prompt', href: '/admin/prompts' },
  { label: 'จัดการผู้ใช้', href: '/admin/users' },
  { label: 'จัดการรีวิว', href: '/admin/reviews' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-[#232336] px-4 py-8">
      <p className="text-xs tracking-[0.3em] text-fuchsia-400/80 font-mono mb-1 uppercase px-3">
        // admin
      </p>
      <p
        className="text-lg font-bold text-[#f2f2f7] mb-6 px-3"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Control Panel
      </p>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                active
                  ? 'text-fuchsia-300 bg-fuchsia-500/10 shadow-[0_0_12px_rgba(255,62,200,0.2)]'
                  : 'text-[#8888a0] hover:text-fuchsia-300 hover:bg-fuchsia-500/5'
              }`}
            >
              {item.label}
            </Link>
          )
        })}

        <Link
          href="/"
          className="px-3 py-2 rounded-lg text-sm font-mono text-[#666680] hover:text-cyan-300 mt-4 border-t border-[#232336] pt-4"
        >
          ← กลับหน้าเว็บหลัก
        </Link>
      </nav>
    </aside>
  )
}