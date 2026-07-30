import type { SupabaseClient } from '@supabase/supabase-js'
import { getGuestId } from '@/lib/guestId'

/**
 * บันทึกการคัดลอก prompt หนึ่งครั้ง
 *
 * กติกา: ยอดที่โชว์นับเป็น "จำนวนคน" ไม่ใช่จำนวนครั้ง
 * คนเดิมกดซ้ำได้ไม่จำกัด แต่ยอดขึ้นแค่ครั้งแรกครั้งเดียว
 * นับทั้งสมาชิกและผู้เยี่ยมชมที่ไม่ได้ล็อกอิน (guest) — คนละ id กัน แต่กติกาเดียวกัน
 *
 * แยกออกมาไว้ที่เดียวเพราะมีปุ่มคัดลอกสองที่ (หน้ารายละเอียด กับปุ่มด่วนบนการ์ด)
 * ถ้าปล่อยให้แต่ละที่เขียนเอง กติกาจะเพี้ยนกันเมื่อแก้ทีหลัง
 *
 * @returns counted = true เมื่อยอดถูกบวกเพิ่มจริง (คนนี้เพิ่งคัดลอกครั้งแรก)
 */
export async function recordCopy(
  supabase: SupabaseClient,
  promptId: string
): Promise<{ counted: boolean }> {
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
    : { user_id: null, guest_id: getGuestId() }

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
