-- แก้ prompt_copies ให้ PostgREST ไม่มองว่าเป็นตารางเชื่อม (junction table)
--
-- ตอนแรกตั้ง primary key เป็น (user_id, prompt_id) ซึ่งเข้าเงื่อนไขที่ PostgREST
-- ใช้เดาความสัมพันธ์ many-to-many อัตโนมัติ ผลคือ prompts กับ profiles มีเส้นทางเชื่อมสองทาง
-- (ทางตรงผ่าน prompts.user_id กับทางอ้อมผ่าน prompt_copies) พอ query เขียน profiles(...)
-- PostgREST จึงตอบ PGRST201 ambiguous relationship แล้วหน้ารายละเอียด prompt กลายเป็น 404 ทั้งเว็บ
--
-- ตาราง favorites เจอปัญหานี้ไม่ได้เพราะมี primary key ของตัวเองแยกต่างหาก
-- ไฟล์นี้จึงเปลี่ยน prompt_copies ให้เป็นรูปแบบเดียวกัน คือ PK แยก + unique (user_id, prompt_id)
-- กติกากันนับซ้ำยังเหมือนเดิมทุกอย่าง เพราะยังชนกันที่ unique constraint และคืน error 23505 เหมือนเดิม
--
-- รันไฟล์นี้เฉพาะฐานข้อมูลที่รัน remove-usage-history.sql เวอร์ชันแรกไปแล้ว
-- (เวอร์ชันปัจจุบันของไฟล์นั้นสร้างตารางเป็นรูปแบบที่ถูกต้องตั้งแต่แรกแล้ว)

alter table public.prompt_copies
  add column if not exists copy_id uuid not null default uuid_generate_v4();

alter table public.prompt_copies drop constraint if exists prompt_copies_pkey;

alter table public.prompt_copies add primary key (copy_id);

alter table public.prompt_copies
  add constraint prompt_copies_user_id_prompt_id_key unique (user_id, prompt_id);
