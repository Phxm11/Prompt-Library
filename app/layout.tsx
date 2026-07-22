import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import Navbar from '@/app/components/Navbar'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Prompt Library',
  description: 'รวม Prompt AI สำหรับสร้างรูปภาพ วิดีโอ งานนำเสนอ และอื่นๆ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-[#0a0a0f] text-[#f2f2f7] font-sans min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}