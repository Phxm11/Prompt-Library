/*
  id ประจำเบราว์เซอร์ของผู้เยี่ยมชมที่ไม่ได้ล็อกอิน

  มีไว้อย่างเดียวคือกันนับซ้ำตอนกดคัดลอก prompt
  ยอดคัดลอกของเว็บนี้นับเป็น "จำนวนคน" ไม่ใช่จำนวนครั้ง สมาชิกกันซ้ำด้วย user_id
  ส่วนคนที่ยังไม่สมัครไม่มีอะไรให้ยึด จึงสุ่ม id ขึ้นมาเก็บไว้ในเครื่องแทน

  ข้อจำกัดที่รู้อยู่แล้วและยอมรับได้:
    - ล้างข้อมูลเบราว์เซอร์ / เปิดโหมดส่วนตัว / ย้ายเครื่อง แล้วจะนับใหม่อีกครั้ง
    - ยังดีกว่านับทุกครั้งที่กด ซึ่งคนเดียวกดรัว ๆ ก็ปั่นยอดได้ไม่จำกัด

  ไม่ใช้ระบุตัวตนหรือให้สิทธิ์อะไรทั้งสิ้น เป็นแค่ตัวนับ
*/

const KEY = 'prompt-library:guest-id'

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing

    // crypto.randomUUID ไม่มีใน browser เก่าและใน context ที่ไม่ใช่ https
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

    localStorage.setItem(KEY, id)
    return id
  } catch {
    // โหมดส่วนตัวบางเบราว์เซอร์เขียน localStorage ไม่ได้ — ยอมให้ยอดไม่ถูกนับ ดีกว่าทำให้ปุ่มคัดลอกพัง
    return null
  }
}
