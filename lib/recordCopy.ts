'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/*
  บันทึกการคัดลอก prompt หนึ่งครั้ง — รันฝั่งเซิร์ฟเวอร์เท่านั้น (Server Action)

  ก่อนหน้านี้ฟังก์ชันนี้รันฝั่งเบราว์เซอร์ (เรียก Supabase ตรง ๆ ผ่าน client ที่หน้าเว็บ)
  จึงไม่มีจุดไหนให้ rate limit ได้เลย ใครก็สคริปต์ยิง insert วนลูปปั่น copy_count ได้ไม่จำกัด
  ย้ายมาเป็น Server Action เพื่อให้มี "ประตู" เดียวที่ทุก request ต้องผ่าน แล้วค่อยจำกัดจำนวนที่ประตูนี้

  กติกา: ยอดที่โชว์นับเป็น "จำนวนคน" ไม่ใช่จำนวนครั้ง
  คนเดิมกดซ้ำได้ไม่จำกัด แต่ยอดขึ้นแค่ครั้งแรกครั้งเดียว
  นับทั้งสมาชิกและผู้เยี่ยมชมที่ไม่ได้ล็อกอิน (guest) — คนละ id กัน แต่กติกาเดียวกัน

  @returns counted = true เมื่อยอดถูกบวกเพิ่มจริง (คนนี้เพิ่งคัดลอกครั้งแรก)
  @returns rateLimited = true เมื่อ IP นี้ยิงถี่เกินกำหนด (ไม่ throw เพราะฝั่ง UI ควร
           แสดงผลว่า "คัดลอกได้ปกติ" อยู่ดี แค่ไม่นับยอดเพิ่ม — ไม่อยากให้ผู้ใช้จริงเห็น error)
*/

// ---- Rate limiter: fixed window แบบเก็บใน memory ----
//
// ข้อจำกัดที่รู้อยู่แล้ว:
//  1) รีเซ็ตทุกครั้งที่ server restart/redeploy
//  2) ถ้า deploy เป็นหลาย instance พร้อมกัน (เช่น serverless หลาย region, หรือรันหลาย process)
//     แต่ละ instance นับแยกกัน ไม่ได้แชร์ตัวนับกัน ทำให้ limit จริงสูงกว่าที่ตั้งไว้ (คูณตามจำนวน instance)
//  3) ถ้าต้องการ rate limit ที่แม่นยำข้าม instance ต้องย้ายตัวนับไปเก็บที่ที่ใช้ร่วมกันได้
//     เช่น Upstash Redis — เพียงพอสำหรับตอนนี้ที่ deploy เป็น instance เดียว
const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20 // ต่อ 1 IP ต่อ 1 นาที — ผู้ใช้จริงกดคัดลอกรัว ๆ ขนาดนี้ไม่ถึงอยู่แล้ว

type Bucket = { count: number; windowStart: number }
const buckets = new Map<string, Bucket>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now })
    return false
  }

  bucket.count += 1
  return bucket.count > MAX_REQUESTS_PER_WINDOW
}

// กัน memory ค่อย ๆ บวมจาก IP เก่าที่ไม่กลับมาอีกแล้ว เก็บกวาดทุก ๆ 1 นาที
setInterval(() => {
  const now = Date.now()
  for (const [ip, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(ip)
  }
}, WINDOW_MS).unref?.()

async function getClientIp(): Promise<string> {
  const h = await headers()
  // x-forwarded-for อาจมีหลาย IP คั่นด้วย comma ถ้าผ่าน proxy หลายชั้น ตัวแรกสุดคือ client จริง
  const forwardedFor = h.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return h.get('x-real-ip') ?? 'unknown'
}

export async function recordCopy(
  promptId: string,
  guestId: string | null
): Promise<{ counted: boolean; rateLimited?: boolean }> {
  const ip = await getClientIp()
  if (isRateLimited(ip)) {
    return { counted: false, rateLimited: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  /*
    ผู้เยี่ยมชมที่ไม่ได้ล็อกอินก็นับให้ โดยกันซ้ำด้วย id ประจำเบราว์เซอร์แทน user_id
    ถ้าเบราว์เซอร์เขียน localStorage ไม่ได้ (โหมดส่วนตัวบางตัว) จะไม่มี id ให้ยึด
    กรณีนั้นยอมให้คัดลอกได้แต่ไม่นับ ดีกว่าปล่อยให้นับซ้ำได้ไม่จำกัด
  */
  const owner = user
    ? { user_id: user.id, guest_id: null }
    : { user_id: null, guest_id: guestId }

  if (!owner.user_id && !owner.guest_id) return { counted: false }

  /*
    prompt_copies เก็บแค่ว่าใครเคยคัดลอก prompt ไหน ไม่มีเวลาและไม่มี action
    ใช้กันนับซ้ำอย่างเดียว ไม่ใช่ประวัติการใช้งาน

    มี unique index คุมอยู่แล้ว เลย insert ตรง ๆ ได้ ถ้าชนแปลว่าเคยคัดลอกไปแล้ว
    วิธีนี้ไม่มีช่องให้กดรัว ๆ พร้อมกันแล้วนับเบิ้ลแบบเช็คก่อนค่อยเขียน
  */
  const { error } = await supabase
    .from('prompt_copies')
    .insert({ prompt_id: promptId, ...owner })

  // 23505 = unique violation คือเคยคัดลอกไปแล้ว ไม่ใช่ความผิดพลาด
  const counted = !error
  if (error && error.code !== '23505') throw error

  if (counted) {
    await supabase.rpc('increment_copy_count', { prompt_id_input: promptId })
  }

  return { counted }
}
