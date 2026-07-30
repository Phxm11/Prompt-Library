-- เก็บ "จุดโฟกัสของรูปปก" เพื่อให้เลือกได้ว่าจะให้ส่วนไหนของรูปโชว์ในกรอบการ์ด 16:9
--
-- ทำไมไม่เก็บรูปที่ครอปแล้ว: cover_image_url เป็น varchar(500) ใส่ data URL ไม่ได้
-- และถ้าเก็บรูปครอปเป็นไฟล์ใหม่ ทุกการ์ดในหน้า /home จะต้องโหลดรูปเพิ่มอีกชุด
-- วิธีนี้ใช้รูปเดิม เปลี่ยนแค่ค่า object-position ตอนแสดงผล ค่าที่เก็บสั้นมาก เช่น '50% 30%'

alter table public.prompts
  add column if not exists cover_position varchar(20) not null default '50% 50%';

comment on column public.prompts.cover_position is
  'ค่า CSS object-position ของรูปปก ใช้ตอนแสดงในกรอบ 16:9 ของการ์ด';
