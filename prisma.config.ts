/*
  โปรเจกต์นี้เก็บ env ไว้ที่ .env.local (ไฟล์ที่ Next.js อ่านเอง)
  Prisma อ่าน .env ให้เท่านั้น จึงต้องสั่งโหลด .env.local เพิ่ม ไม่งั้นต้องเก็บ DATABASE_URL สองที่

  url ตรงนี้ใช้กับคำสั่ง CLI (db pull / migrate) จึงควรเป็น connection แบบ direct พอร์ต 5432
  ส่วนตอนแอปรันจริงใช้แบบ pooled พอร์ต 6543 ซึ่งตั้งไว้ใน lib/prisma.ts
*/
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
