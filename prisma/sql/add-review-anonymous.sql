-- ให้ผู้ใช้เลือกได้ว่าจะรีวิวแบบแสดงโปรไฟล์ หรือแบบไม่ระบุตัวตน
--
-- เก็บ user_id ไว้เสมอแม้เลือกไม่ระบุตัวตน เพราะ
--   1) เจ้าของต้องกลับมาแก้/ลบรีวิวตัวเองได้ ซึ่ง RLS ตัดสินจาก auth.uid() = user_id
--   2) policy เดิมเปิดให้ "ใครก็ได้" แก้/ลบแถวที่ user_id เป็น null
--      ถ้าใช้วิธีตั้ง user_id = null เพื่อซ่อนตัวตน จะกลายเป็นว่าคนอื่นแก้รีวิวนั้นได้ด้วย
-- การซ่อนตัวตนจึงทำที่ชั้นแสดงผลผ่านคอลัมน์นี้แทน

alter table public.reviews
  add column if not exists is_anonymous boolean not null default false;

comment on column public.reviews.is_anonymous is
  'true = ไม่แสดงชื่อ/รูปโปรไฟล์ของผู้เขียนในหน้าเว็บ (ยังผูก user_id ไว้เพื่อสิทธิ์แก้/ลบ)';
