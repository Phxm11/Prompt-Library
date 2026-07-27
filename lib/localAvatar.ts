/*
  ที่เก็บรูปโปรไฟล์สำรองในเครื่อง

  ใช้เฉพาะกรณีที่ฐานข้อมูลรับรูปไม่ได้ (คอลัมน์ profiles.avatar_url เป็น varchar(500)
  ส่วน data URL ของรูปยาวราว 24,000 ตัวอักษร) เพื่อให้ผู้ใช้ตั้งรูปแล้วเห็นผลได้ทันที

  ข้อจำกัดที่ต้องบอกผู้ใช้ให้ชัดเสมอ: รูปอยู่แค่บนเบราว์เซอร์เครื่องนี้
  เปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์แล้วหาย และคนอื่นไม่เห็น
  พอเปลี่ยนชนิดคอลัมน์เป็น text แล้วให้เก็บลงฐานข้อมูลตามปกติ ตัวนี้จะถูกล้างทิ้ง
*/

const KEY_PREFIX = 'prompt-library:avatar:'

export function getLocalAvatar(userId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY_PREFIX + userId)
  } catch {
    return null
  }
}

export function setLocalAvatar(userId: string, dataUrl: string): boolean {
  try {
    localStorage.setItem(KEY_PREFIX + userId, dataUrl)
    return true
  } catch {
    // localStorage เต็มหรือถูกปิด (โหมดส่วนตัวบางเบราว์เซอร์)
    return false
  }
}

export function clearLocalAvatar(userId: string) {
  try {
    localStorage.removeItem(KEY_PREFIX + userId)
  } catch {
    // ไม่ต้องทำอะไร ถ้าลบไม่ได้ก็ปล่อยไป
  }
}
