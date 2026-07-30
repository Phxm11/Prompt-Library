-- เลิกเก็บประวัติการใช้งานทั้งหมด
--
-- usage_history เดิมทำสองหน้าที่ปนกัน คือเก็บ "ประวัติ" ไว้โชว์ผู้ใช้
-- กับใช้เป็นตัวกันนับซ้ำของยอดคัดลอก (นับเป็นจำนวนคน ไม่ใช่จำนวนครั้ง)
--
-- ไฟล์นี้ตัดหน้าที่แรกทิ้ง แล้วย้ายหน้าที่สองไปอยู่ตาราง prompt_copies ที่เก็บแค่
-- คู่ (user_id, prompt_id) ไม่มีเวลาและไม่มี action ใด ๆ จึงย้อนดูพฤติกรรมผู้ใช้ไม่ได้

-- 1) ตารางกันนับซ้ำของยอดคัดลอก
--
--    ต้องมี primary key เป็นคอลัมน์ของตัวเอง แล้วกันซ้ำด้วย unique แทน
--    ถ้าตั้ง PK เป็น (user_id, prompt_id) ตรง ๆ PostgREST จะเดาว่าตารางนี้เป็นตัวเชื่อม
--    many-to-many ระหว่าง prompts กับ profiles ทำให้ query ที่ embed profiles(...) กำกวม
--    แล้วพังทั้งเว็บ (PGRST201) ตาราง favorites ก็ตั้งแบบนี้ด้วยเหตุผลเดียวกัน
create table if not exists public.prompt_copies (
  copy_id   uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid not null references public.prompts(prompt_id) on delete cascade,
  unique (user_id, prompt_id)
);

comment on table public.prompt_copies is
  'คู่ผู้ใช้–prompt ที่เคยกดคัดลอก ใช้กันนับซ้ำอย่างเดียว ไม่ใช่ประวัติการใช้งาน';

create index if not exists idx_prompt_copies_prompt on public.prompt_copies(prompt_id);

-- 2) ย้ายข้อมูลเดิมมาก่อนที่จะทิ้ง usage_history ไม่งั้นยอดคัดลอกจะรีเซ็ตหมด
insert into public.prompt_copies (user_id, prompt_id)
select distinct u.user_id, u.prompt_id
from public.usage_history u
where u.action_type = 'copy'
  and u.user_id is not null
  and u.prompt_id is not null
on conflict do nothing;

-- 3) RLS: ใครก็ยิง insert ได้เท่าที่เป็นแถวของตัวเอง และไม่เปิดให้อ่านข้ามคน
--    ฝั่งเว็บอ่านแค่ว่า "ฉันเคยคัดลอกอันนี้หรือยัง" จึงพอแล้ว
alter table public.prompt_copies enable row level security;

drop policy if exists prompt_copies_select_own on public.prompt_copies;
create policy prompt_copies_select_own on public.prompt_copies
  for select using (auth.uid() = user_id);

drop policy if exists prompt_copies_insert_own on public.prompt_copies;
create policy prompt_copies_insert_own on public.prompt_copies
  for insert with check (auth.uid() = user_id);

-- 4) หน้ายอดนิยมเคยนับ copy_uses จาก usage_history ย้ายมานับจาก prompt_copies
--    สูตรเหมือนเดิมทุกอย่าง คือจำนวนคนที่ไม่ซ้ำ
create or replace function public.get_popular_prompts(result_limit integer default 20)
returns table(
  prompt_id uuid,
  title character varying,
  prompt_text text,
  cover_image_url character varying,
  view_count integer,
  like_count integer,
  copy_count integer,
  category_name character varying,
  media_type_name character varying,
  copy_uses bigint
)
language sql
security definer
as $function$
    select
        p.prompt_id,
        p.title,
        p.prompt_text,
        p.cover_image_url,
        p.view_count,
        p.like_count,
        p.copy_count,
        c.name as category_name,
        m.name as media_type_name,
        count(distinct pc.user_id) as copy_uses
    from prompts p
    left join categories c on c.category_id = p.category_id
    left join media_types m on m.media_type_id = p.media_type_id
    left join prompt_copies pc on pc.prompt_id = p.prompt_id
    where p.is_public = true
    group by p.prompt_id, c.name, m.name
    order by copy_uses desc, p.copy_count desc
    limit result_limit;
$function$;

-- 5) ทิ้งตารางประวัติ
--    ขั้นนี้ลบข้อมูลถาวรและย้อนกลับไม่ได้ รันเมื่อยืนยันว่าข้อ 2 ย้ายครบแล้วเท่านั้น
drop table if exists public.usage_history;
