import type { MetadataRoute } from 'next'

/*
  ยังไม่มี domain จริง เลยอ่านจาก NEXT_PUBLIC_SITE_URL แทนการ hardcode
  พอได้ domain แล้วแค่ตั้งค่า env ตัวนี้ใน production ไฟล์นี้ไม่ต้องแก้อะไรเพิ่ม
  ระหว่างยังไม่ตั้ง จะ fallback ไปที่ localhost ไว้ก่อนเพื่อไม่ให้ build พัง
*/
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/login',
        '/profile',
        '/favorites',
        '/prompts/new',
        '/prompts/*/edit',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
