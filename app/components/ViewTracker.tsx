'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * นับยอดเข้าชม prompt
 *
 * ทำไมต้องเป็น client component แทนที่จะยิงจาก server component ตอนเรนเดอร์:
 *
 * 1. query ของ supabase-js เป็น lazy builder จะส่ง request ก็ต่อเมื่อมี await หรือ .then()
 *    โค้ดเดิมเรียกแบบ fire-and-forget ไม่ await เลย จึง "ไม่เคยยิงออกไปเลยแม้แต่ครั้งเดียว"
 *
 * 2. ถ้าแก้เป็น await ในหน้า server จะโดนนับตอน Next prefetch หน้าไว้ล่วงหน้าด้วย
 *    ยอดจะพุ่งทั้งที่ยังไม่มีใครเปิดดูจริง
 */
export default function ViewTracker({ promptId }: { promptId: string }) {
  const sent = useRef(false)

  useEffect(() => {
    // React ใน dev เรียก effect ซ้ำสองรอบ ถ้าไม่กันจะนับเบิ้ล
    if (sent.current) return
    sent.current = true

    const supabase = createClient()

    async function track() {
      await supabase.rpc('increment_view_count', { prompt_id_input: promptId })
    }

    track().catch((err) => {
      // นับยอดพลาดไม่ควรทำให้หน้าเว็บพัง แค่บันทึกไว้ดู
      console.error('[view] track failed:', err instanceof Error ? err.message : err)
    })
  }, [promptId])

  return null
}
