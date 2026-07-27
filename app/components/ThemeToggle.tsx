'use client'

import { useEffect, useState } from 'react'
import Icon from '@/app/components/Icon'

type Theme = 'dark' | 'light'

export const THEME_KEY = 'prompt-library-theme'

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // โหมดส่วนตัวบางเบราว์เซอร์เขียน localStorage ไม่ได้ — ให้สลับได้อยู่ แค่ไม่จำข้ามหน้า
  }
}

export default function ThemeToggle() {
  // ต้องตรงกับค่าเริ่มต้นที่ script ใน layout ตั้งไว้ ไม่งั้นไอคอนจะสลับผิดตอน hydrate
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) ?? 'light'
    setTheme(current)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    apply(next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
      title={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-accent/50 hover:text-accent"
    >
      {/* ไอคอนสองตัวซ้อนกัน สลับด้วยการหมุน+เฟด จะได้ไม่กระตุกตอนเปลี่ยน */}
      <span
        className={`absolute transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
        }`}
      >
        <Icon name="moon" size={17} />
      </span>
      <span
        className={`absolute transition-all duration-300 ${
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      >
        <Icon name="sun" size={17} />
      </span>
    </button>
  )
}
