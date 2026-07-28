/*
  เตรียมรูปก่อนอัปโหลด

  กติกา
  - ไฟล์ต้นทางใหญ่ได้ไม่เกิน 10MB (เกินกว่านี้ปฏิเสธไปเลย ไม่ต้องเสียเวลาโหลดเข้าเบราว์เซอร์)
  - ย่อให้ด้านกว้างไม่เกิน 1920px และด้านสูงไม่เกิน 1920px โดยคงสัดส่วนเดิม
  - บีบให้ไฟล์ผลลัพธ์ไม่เกิน 2MB โดยไล่ลดคุณภาพลงทีละขั้น

  ทำไมต้องย่อฝั่ง client: รูปจากมือถือทุกวันนี้กว้าง 4000px ขึ้นไปและหนัก 5-10MB
  ถ้าอัปดิบ ๆ หน้า /home ที่มี 12 การ์ดจะต้องโหลดรูปรวมกันหลายสิบเมกะไบต์
  ทั้งที่กรอบการ์ดกว้างจริงแค่ ~400px
*/

export const MAX_SOURCE_BYTES = 10 * 1024 * 1024 // 10MB
export const MAX_OUTPUT_BYTES = 2 * 1024 * 1024 // 2MB
export const MAX_DIMENSION = 1920

/** ชนิดไฟล์ที่ย่อแล้วเสียของ จึงปล่อยผ่านโดยไม่แตะ แต่ยังจำกัดขนาด */
const SKIP_RESIZE_TYPES = ['image/gif', 'image/svg+xml']

export class ImageTooLargeError extends Error {}

export async function prepareImageUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new ImageTooLargeError('เลือกได้เฉพาะไฟล์รูปภาพ')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageTooLargeError(
      `ไฟล์ใหญ่เกินไป (${formatMB(file.size)}) รองรับไม่เกิน ${formatMB(MAX_SOURCE_BYTES)}`
    )
  }

  // gif เคลื่อนไหวกับ svg ถ้าวาดลง canvas จะกลายเป็นภาพนิ่ง/แตก จึงไม่ย่อ
  if (SKIP_RESIZE_TYPES.includes(file.type)) {
    if (file.size > MAX_OUTPUT_BYTES) {
      throw new ImageTooLargeError(
        `ไฟล์ ${file.type.replace('image/', '')} ต้องไม่เกิน ${formatMB(MAX_OUTPUT_BYTES)}`
      )
    }
    return file
  }

  const bitmap = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))

  // เล็กพออยู่แล้วทั้งขนาดภาพและขนาดไฟล์ ไม่ต้องเข้ารหัสใหม่ให้เสียคุณภาพฟรี ๆ
  if (scale === 1 && file.size <= MAX_OUTPUT_BYTES) return file

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)

  // ไล่ลดคุณภาพจนกว่าจะเข้าเพดาน ไม่ลดต่ำกว่า 0.6 เพราะจะเริ่มเห็นรอยบล็อก
  for (const quality of [0.9, 0.82, 0.72, 0.6]) {
    const blob = await toBlob(canvas, quality)
    if (!blob) break
    if (blob.size <= MAX_OUTPUT_BYTES || quality === 0.6) {
      return new File([blob], replaceExtension(file.name), {
        type: blob.type,
        lastModified: Date.now(),
      })
    }
  }

  return file
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageTooLargeError('เปิดไฟล์รูปนี้ไม่ได้ อาจเสียหายหรือไม่รองรับ'))
    }
    img.src = url
  })
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  // webp เล็กกว่า jpeg ที่คุณภาพเท่ากันราว 25-30% และเบราว์เซอร์ยุคนี้รองรับหมดแล้ว
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
}

function replaceExtension(name: string) {
  return name.replace(/\.[^.]+$/, '') + '.webp'
}

export function formatMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
