// ค่าเดียวกับ inputClass/labelClass ใน PromptForm.tsx เพื่อให้หน้าตาฟอร์มทั้งเว็บไปทางเดียวกัน
export const inputClass =
  'w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

export const labelClass =
  'text-xs font-mono font-medium text-accent/80 tracking-widest mb-2 block uppercase'

/**
 * แปล error จาก Postgres ให้คนอ่านเข้าใจ โดยไม่ต้องรู้จักรหัส error
 * 23503 = foreign key violation คือแถวนี้ยังมีข้อมูลอื่นผูกอยู่ (เช่น prompt ที่ใช้หมวดหมู่นี้)
 * 23505 = unique violation คือค่าซ้ำกับที่มีอยู่แล้ว (เช่น slug หรือชื่อแท็ก)
 */
export function friendlyDbError(error: { code?: string; message: string }): string {
  if (error.code === '23503') {
    return 'ลบไม่ได้ เพราะยังมี Prompt หรือข้อมูลอื่นผูกอยู่กับรายการนี้ ต้องย้ายหรือลบสิ่งที่ผูกอยู่ก่อน'
  }
  if (error.code === '23505') {
    return 'มีรายการที่ใช้ค่านี้อยู่แล้ว กรุณาใช้ค่าอื่น'
  }
  return error.message
}
