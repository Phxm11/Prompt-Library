'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'ภาพรวม', href: '/admin' },
  { label: 'จัดการ Prompt', href: '/admin/prompts' },
  { label: 'จัดการผู้ใช้', href: '/admin/users' },
  { label: 'จัดการรีวิว', href: '/admin/reviews' },
  { label: 'หมวดหมู่ & ข้อมูลอ้างอิง', href: '/admin/catalog' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    // จอเล็กกว่า lg: แถบเมนูแนวนอนเลื่อนได้ ติดด้านบนใต้ navbar หลัก แทนคอลัมน์ข้างที่กิน 224px ถาวร
    // (เดิม w-56 shrink-0 แสดงตลอดไม่มีทางซ่อน พังทันทีบนจอมือถือ)
    <aside className="shrink-0 border-b border-line px-4 py-3 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-56 lg:border-b-0 lg:border-r lg:px-4 lg:py-8">
      <h2 className="section-title hidden text-xl font-extrabold mb-6 px-3 lg:block">Control Panel</h2>

      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-mono transition-all ${
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
          className="shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-mono text-faint hover:text-accent lg:mt-4 lg:border-t lg:border-line lg:pt-4"
        >
          ← กลับหน้าเว็บหลัก
        </Link>
      </nav>
    </aside>
  )
}
