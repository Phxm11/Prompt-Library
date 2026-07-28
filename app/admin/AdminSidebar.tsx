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
    <aside className="w-56 shrink-0 border-r border-line px-4 py-8">
      <h2 className="section-title text-xl font-extrabold mb-6 px-3">Control Panel</h2>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                active
                  ? 'text-accent2 bg-accent2/10 shadow-[0_0_12px_rgba(255,62,200,0.2)]'
                  : 'text-muted hover:text-accent2 hover:bg-accent2/5'
              }`}
            >
              {item.label}
            </Link>
          )
        })}

        <Link
          href="/"
          className="px-3 py-2 rounded-lg text-sm font-mono text-faint hover:text-accent mt-4 border-t border-line pt-4"
        >
          ← กลับหน้าเว็บหลัก
        </Link>
      </nav>
    </aside>
  )
}
