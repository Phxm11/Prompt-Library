import { ImageResponse } from 'next/og'

// ก่อนหน้านี้ไม่มีไฟล์ favicon เลย เบราว์เซอร์เลยโชว์ไอคอนเปล่า ๆ ที่แท็บ
// ใช้ ImageResponse สร้างขึ้นตอน build/request แทนการเตรียมไฟล์ภาพเอง (ยังไม่มีโลโก้จริง)
// สีตรงกับธีมหลักของเว็บ (พื้นเข้ม + ฟ้านีออน) ใน app/globals.css
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          borderRadius: 6,
          color: '#67e8f9',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        P
      </div>
    ),
    { ...size }
  )
}
