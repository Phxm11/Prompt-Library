import type { Metadata } from 'next'
import { Prompt, JetBrains_Mono } from 'next/font/google'
import Navbar from '@/app/components/Navbar'
import Toaster from '@/app/components/Toast'
import './globals.css'

// ฟอนต์หลักทั้งเว็บ (ไทย + ละติน) — Prompt ไม่ใช่ variable font จึงต้องระบุน้ำหนักเป็น array
const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-prompt',
})

// ตัวเลข/ภาษาอังกฤษ — โทนเทอร์มินัลให้เข้ากับธีม
// เป็น variable font (แกน wght 100–800) จึงโหลดไฟล์เดียวได้ครบทุกน้ำหนัก
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'Prompt Library',
  description: 'รวม Prompt AI สำหรับสร้างรูปภาพ วิดีโอ งานนำเสนอ และอื่นๆ',
}

/*
  ค่าเริ่มต้นคือธีมสว่าง ถ้าเคยเลือกไว้ก็ใช้ค่าที่จำใน localStorage
  ต้องเป็น inline script ใน head เท่านั้น เพราะ React hydrate หลังเบราว์เซอร์วาดเฟรมแรกไปแล้ว
  ถ้าไปตั้งใน component คนที่เลือกธีมมืดไว้จะเห็นจอขาวแวบหนึ่งทุกครั้งที่โหลด
*/
const themeScript = `(function(){try{var t=localStorage.getItem('prompt-library-theme');document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:'light'}catch(e){document.documentElement.dataset.theme='light'}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      data-theme="light"
      suppressHydrationWarning
      className={`${prompt.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-base text-ink font-sans min-h-screen antialiased">
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
