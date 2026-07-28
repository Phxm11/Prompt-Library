/*
  จำโปรไฟล์ที่เห็นล่าสุดไว้ในเครื่อง เพื่อลบอาการรูปโปรไฟล์กระพริบตอนรีเฟรช

  ปัญหาเดิม: Navbar เป็น client component ที่เริ่มจากไม่รู้อะไรเลย
  แล้วต้องรอสองจังหวะกว่าจะวาดรูปได้ถูก
    1) getUser() กลับมา  → เพิ่งรู้ว่าล็อกอินอยู่ ตอนนี้ยังไม่มีรูป เลยวาดตัวอักษรย่อไปก่อน
    2) โหลด profiles เสร็จ → ค่อยสลับจากตัวอักษรเป็นรูปจริง
  ผู้ใช้จึงเห็นของเปลี่ยนสองครั้งทุกครั้งที่รีเฟรช

  ที่เก็บนี้ทำให้จังหวะแรกวาดรูปเดิมได้เลย แล้วค่อยแก้ทีหลังถ้าข้อมูลจริงไม่ตรง
  เป็นแค่ข้อมูลไว้โชว์ ไม่ใช่ตัวตัดสินสิทธิ์ ทุกอย่างที่ต้องใช้สิทธิ์ยังตัดสินจาก session จริงเสมอ
*/

export type CachedProfile = {
  email: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: string | null
}

const KEY = 'prompt-library:profile-cache'

export function readProfileCache(): CachedProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedProfile
    return typeof parsed?.email === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function writeProfileCache(value: CachedProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // localStorage เต็มหรือถูกปิด ก็แค่กลับไปกระพริบเหมือนเดิม ไม่ใช่เรื่องคอขาดบาดตาย
  }
}

export function clearProfileCache() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ไม่ต้องทำอะไร
  }
}
