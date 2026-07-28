import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'

/*
  Prisma 7 ไม่มี Rust engine แล้ว ต้องต่อผ่าน driver adapter เสมอ

  เชื่อมต่อ Supabase ให้ใช้ connection string แบบ pooled (พอร์ต 6543 ผ่าน pgbouncer)
  เพราะ Next.js สร้าง instance ใหม่ได้บ่อยและ Postgres รับ connection ตรงได้จำกัด
  ส่วนคำสั่ง CLI (db pull / migrate) ให้ใช้แบบ direct (พอร์ต 5432) ตั้งไว้ใน prisma.config.ts

  ข้อควรรู้: Prisma ต่อฐานข้อมูลตรง ๆ จึง "ข้าม RLS ทั้งหมด"
  โค้ดที่ใช้ Prisma ต้องกรองสิทธิ์เองทุกครั้ง เช่น .where({ userId })
  ต่างจาก supabase-js เดิมที่ Postgres บังคับ policy ให้อยู่แล้ว
*/
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'ยังไม่ได้ตั้ง DATABASE_URL — ใส่ connection string ของ Supabase ใน .env.local ก่อน'
    )
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

// dev mode ของ Next.js โหลดโมดูลใหม่ทุกครั้งที่แก้ไฟล์
// ถ้าไม่เก็บไว้ที่ globalThis จะเปิด connection pool ใหม่เรื่อย ๆ จนฐานข้อมูลปฏิเสธ
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
