import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  // ImageResponse render ผ่าน Satori ฝั่งเซิร์ฟเวอร์ ไม่ใช่เบราว์เซอร์
  // <img src="..."> จึงต้องเป็น absolute URL หรือ data URI เท่านั้น path แบบ "/images/xxx.png" ใช้ไม่ได้
  const file = await readFile(
    join(process.cwd(), 'public', 'images', 'ChatGPT Image 3 ส.ค. 2569 16_11_04.png')
  )
  const base64 = file.toString('base64')
  const dataUrl = `data:image/png;base64,${base64}`

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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} width={32} height={32} style={{ objectFit: 'cover' }} />
      </div>
    ),
    { ...size }
  )
}