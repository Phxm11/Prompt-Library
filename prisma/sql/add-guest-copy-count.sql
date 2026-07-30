-- ให้ผู้เยี่ยมชมที่ไม่ได้ล็อกอิน (guest) คัดลอก prompt แล้วนับยอดได้ด้วย
--
-- เดิม recordCopy() ตัดจบทันทีถ้าไม่มี user เพราะ prompt_copies กันซ้ำด้วย user_id
-- คนที่ยังไม่สมัครจึงกดคัดลอกได้ก็จริง แต่ยอดไม่ขยับเลย ทั้งที่เป็นผู้ใช้ส่วนใหญ่ของเว็บ
--
-- วิธีนับ: ให้เบราว์เซอร์ของ guest สร้าง id สุ่มของตัวเองเก็บไว้ในเครื่อง แล้วส่งมาด้วย
-- กติกา "นับเป็นจำนวนคน" จึงยังอยู่ เท่าที่จะทำได้กับคนที่ไม่มีบัญชี
-- (ล้างข้อมูลเบราว์เซอร์หรือย้ายเครื่องแล้วนับใหม่ได้ ซึ่งรับได้ ดีกว่านับทุกครั้งที่กด)

alter table public.prompt_copies
  add column if not exists guest_id text;

comment on column public.prompt_copies.guest_id is
  'id สุ่มจากเบราว์เซอร์ของผู้เยี่ยมชมที่ไม่ได้ล็อกอิน ใช้กันนับซ้ำแทน user_id';

-- สมาชิกใช้ user_id ส่วน guest ใช้ guest_id จึงต้องปล่อยให้ user_id ว่างได้
alter table public.prompt_copies
  alter column user_id drop not null;

-- ต้องมีอย่างใดอย่างหนึ่งเสมอ ไม่งั้นจะเป็นแถวที่ไม่รู้ว่าใครกด
alter table public.prompt_copies
  drop constraint if exists prompt_copies_owner_present;
alter table public.prompt_copies
  add constraint prompt_copies_owner_present
  check (user_id is not null or guest_id is not null);

/*
  unique เดิมบนคู่ (user_id, prompt_id) กัน guest ไม่ได้
  เพราะใน SQL ค่า null ไม่เท่ากับ null ต่อให้ prompt เดียวกันก็ไม่ถือว่าซ้ำ
  จึงต้องใช้ partial unique index แยกสองชุด
*/
alter table public.prompt_copies
  drop constraint if exists prompt_copies_user_id_prompt_id_key;

create unique index if not exists prompt_copies_user_unique
  on public.prompt_copies (user_id, prompt_id)
  where user_id is not null;

create unique index if not exists prompt_copies_guest_unique
  on public.prompt_copies (guest_id, prompt_id)
  where guest_id is not null;

/*
  RLS: เปิดให้ guest เขียนแถวของตัวเองได้ แต่ต้องเป็นแถวที่ไม่มี user_id เท่านั้น
  กันไม่ให้ยิงแถวสวมรอยเป็นสมาชิกคนอื่น
*/
drop policy if exists prompt_copies_insert_guest on public.prompt_copies;
create policy prompt_copies_insert_guest on public.prompt_copies
  for insert
  with check (user_id is null and guest_id is not null);

-- หน้ายอดนิยมต้องนับ guest ด้วย ไม่งั้นตัวเลขจะน้อยกว่า copy_count ที่โชว์คู่กัน
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
        -- สมาชิกนับจาก user_id ส่วน guest นับจาก guest_id คนละคนกันเสมอ
        count(distinct coalesce(pc.user_id::text, pc.guest_id)) as copy_uses
    from prompts p
    left join categories c on c.category_id = p.category_id
    left join media_types m on m.media_type_id = p.media_type_id
    left join prompt_copies pc on pc.prompt_id = p.prompt_id
    where p.is_public = true
    group by p.prompt_id, c.name, m.name
    order by copy_uses desc, p.copy_count desc
    limit result_limit;
$function$;
