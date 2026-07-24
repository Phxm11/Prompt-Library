import type { Metadata } from 'next'
import Navbar from '@/app/components/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prompt Library',
  description: 'รวม Prompt AI สำหรับสร้างรูปภาพ วิดีโอ งานนำเสนอ และอื่นๆ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-[#0a0a0f] text-[#f2f2f7] font-sans min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
