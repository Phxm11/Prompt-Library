-- รองรับการซูม/ขยับรูปเพื่อเลือกกรอบที่จะโชว์ ทั้งรูปหลักและรูปตัวอย่าง
--
-- เก็บเป็น "วิธีแสดงผล" ไม่ใช่รูปที่ครอปแล้ว
--   position = ค่า CSS object-position เช่น '50% 30%'
--   zoom     = ตัวคูณขนาด 1 = พอดีกรอบ, 2 = ซูมเข้าสองเท่า
-- ข้อดีคือรูปต้นฉบับไม่ถูกทำลาย ปรับใหม่กี่ครั้งก็ได้โดยไม่เสียคุณภาพ
-- และไม่ต้องอัปโหลดไฟล์เพิ่มทุกครั้งที่แก้กรอบ

alter table public.prompts
  add column if not exists cover_zoom numeric(4, 2) not null default 1;

alter table public.prompt_examples
  add column if not exists position varchar(20) not null default '50% 50%',
  add column if not exists zoom numeric(4, 2) not null default 1;

comment on column public.prompts.cover_zoom is 'ตัวคูณซูมของรูปปก (1 = พอดีกรอบ)';
comment on column public.prompt_examples.position is 'ค่า CSS object-position ของรูปตัวอย่าง';
comment on column public.prompt_examples.zoom is 'ตัวคูณซูมของรูปตัวอย่าง (1 = พอดีกรอบ)';
