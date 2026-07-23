import { createBrowserClient } from '@supabase/ssr'

// เก็บ instance ไว้ใช้ซ้ำ (module-level singleton)
// ป้องกันปัญหา "Multiple GoTrueClient instances detected" ที่เกิดจากการเรียก
// createClient() หลายครั้งในหลาย component แล้วสร้าง client ใหม่ทุกครั้ง
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}