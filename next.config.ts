import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // เปิด <ViewTransition> ของ React ให้รูปในการ์ดมอร์ฟไปเป็นรูปใหญ่
    // ตอนกดเข้าหน้ารายละเอียด (เบราว์เซอร์ที่ไม่รองรับจะเปลี่ยนหน้าตามปกติ)
    viewTransition: true,
  },

  async redirects() {
    return [
      {
        // เลิกใช้การสมัครด้วยอีเมล/รหัสผ่านแล้ว บัญชีถูกสร้างอัตโนมัติตอนล็อกอินครั้งแรก
        // ยังกันไว้เผื่อมีลิงก์เก่าหรือคนบุ๊กมาร์กหน้า /signup ไว้
        source: '/signup',
        destination: '/login',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
