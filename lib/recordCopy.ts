import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * บันทึกการคัดลอก prompt หนึ่งครั้ง
 *
 * กติกา: ยอดที่โชว์นับเป็น "จำนวนคน" ไม่ใช่จำนวนครั้ง
 * คนเดิมกดซ้ำได้ไม่จำกัด แต่ยอดขึ้นแค่ครั้งแรกครั้งเดียว
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

  // คนที่ไม่ได้ล็อกอินแยกไม่ออกว่าเป็นคนเดิมหรือเปล่า จึงไม่นับให้เลย
  if (!user) return { counted: false }

  /*
    prompt_copies เก็บแค่คู่ (user_id, prompt_id) ไม่มีเวลาและไม่มี action
    ใช้กันนับซ้ำอย่างเดียว ไม่ใช่ประวัติการใช้งาน

    primary key เป็นคู่นี้อยู่แล้ว เลย insert ตรง ๆ ได้ ถ้าชนแปลว่าคนนี้เคยคัดลอกแล้ว
    วิธีนี้ไม่มีช่องให้กดรัว ๆ พร้อมกันแล้วนับเบิ้ลแบบเช็คก่อนค่อยเขียน
  */
  const { error } = await supabase
    .from('prompt_copies')
    .insert({ prompt_id: promptId, user_id: user.id })

  // 23505 = unique violation คือเคยคัดลอกไปแล้ว ไม่ใช่ความผิดพลาด
  const counted = !error
  if (error && error.code !== '23505') throw error

  if (counted) {
    await supabase.rpc('increment_copy_count', { prompt_id_input: promptId })
  }

  return { counted }
}
