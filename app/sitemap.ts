import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

/*
  บังคับให้เป็น dynamic (สร้างตอนมีคนเข้าจริง ไม่ใช่ตอน build)
  เหตุผล: ถ้าปล่อยให้ Next.js prerender เป็น static ตอน build มันจะต้องต่อฐานข้อมูลจริงตอนนั้นเลย
  ถ้า DATABASE_URL ผิดหรือฐานข้อมูลเข้าไม่ได้ชั่วคราว จะทำให้ "ทั้งเว็บ deploy ไม่ได้"
  ทั้งที่หน้าอื่นทั้งหมดไม่ได้ใช้ Prisma เลย (ใช้ Supabase client คนละชุด env กัน)
  เปลี่ยนเป็น dynamic แล้วต่อให้ค่านี้ผิดพลาด กระทบแค่ /sitemap.xml หน้าเดียวตอนมีคนเข้าจริง ไม่ทำให้ deploy ล้มทั้งเว็บ
*/
export const dynamic = 'force-dynamic'

/*
  ยังไม่มี domain จริง เลยอ่านจาก NEXT_PUBLIC_SITE_URL แทนการ hardcode
  พอได้ domain แล้วแค่ตั้งค่า env ตัวนี้ใน production ไฟล์นี้ไม่ต้องแก้อะไรเพิ่ม
*/
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// เพดานจำนวน URL ต่อไฟล์ตามสเปกของ sitemap.xml คือ 50,000
// ถ้า prompt สาธารณะเกินจำนวนนี้ในอนาคต ต้องเปลี่ยนไปทำ sitemap index (หลายไฟล์) แทน
const MAX_URLS = 5000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/popular`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/search`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${siteUrl}/media-types`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/ai-models`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const [prompts, mediaTypes, aiModels, profiles] = await Promise.all([
    prisma.prompts.findMany({
      where: { is_public: true, status: 'published' },
      select: { prompt_id: true, updated_at: true },
      orderBy: { updated_at: 'desc' },
      take: MAX_URLS,
    }),
    prisma.media_types.findMany({ select: { slug: true } }),
    prisma.ai_models.findMany({
      where: { is_active: true },
      select: { ai_model_id: true },
    }),
    prisma.profiles.findMany({
      where: { is_banned: false },
      select: { username: true, updated_at: true },
      take: MAX_URLS,
    }),
  ])

  const promptRoutes: MetadataRoute.Sitemap = prompts.map((p: { prompt_id: string; updated_at: Date | null }) => ({
    url: `${siteUrl}/prompts/${p.prompt_id}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const mediaTypeRoutes: MetadataRoute.Sitemap = mediaTypes.map((m: { slug: string }) => ({
    url: `${siteUrl}/media-types/${m.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const aiModelRoutes: MetadataRoute.Sitemap = aiModels.map((a: { ai_model_id: string }) => ({
    url: `${siteUrl}/ai-models/${a.ai_model_id}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const profileRoutes: MetadataRoute.Sitemap = profiles.map((p: { username: string; updated_at: Date | null }) => ({
    url: `${siteUrl}/u/${p.username}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.4,
  }))

  return [
    ...staticRoutes,
    ...promptRoutes,
    ...mediaTypeRoutes,
    ...aiModelRoutes,
    ...profileRoutes,
  ]
}
