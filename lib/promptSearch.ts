/**
 * สร้างเงื่อนไขค้นหา prompt สำหรับ .or() ของ supabase
 *
 * เดิมหน้า /search ใช้ full-text search บน search_vector ซึ่งตั้ง config เป็น 'simple'
 * แบบนั้นต้องพิมพ์ให้ตรงทั้งคำถึงจะเจอ พิมพ์แค่บางส่วนหรือพิมพ์ภาษาไทยที่ไม่มีเว้นวรรค
 * จะไม่เจออะไรเลย จึงเปลี่ยนมาใช้ ilike ที่จับคำบางส่วนได้จริง
 *
 * ต้อง escape % _ \ เพราะเป็นอักขระพิเศษของ LIKE
 * และตัด , ทิ้ง เพราะ .or() ใช้จุลภาคคั่นเงื่อนไข ถ้าไม่กันจะแตกเป็นคนละเงื่อนไข
 *
 * ผู้เรียกต้องใช้คู่กันทั้งฝั่ง server และ client ไม่งั้นหน้าแรกกับหน้าถัดไปจะได้คนละชุด
 */
export function promptSearchFilter(keyword: string): string {
  const escaped = keyword.replace(/[%_\\]/g, (ch) => `\\${ch}`).replace(/,/g, '')
  return [
    `title.ilike.%${escaped}%`,
    `description.ilike.%${escaped}%`,
    `prompt_text.ilike.%${escaped}%`,
  ].join(',')
}
