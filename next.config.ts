import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // เปิด <ViewTransition> ของ React ให้รูปในการ์ดมอร์ฟไปเป็นรูปใหญ่
    // ตอนกดเข้าหน้ารายละเอียด (เบราว์เซอร์ที่ไม่รองรับจะเปลี่ยนหน้าตามปกติ)
    viewTransition: true,
  },
};

export default nextConfig;
