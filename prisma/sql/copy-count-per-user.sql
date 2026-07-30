-- เปลี่ยนนิยามของ "ยอดคัดลอก" จาก "จำนวนครั้ง" เป็น "จำนวนคนที่คัดลอก"
-- ผู้ใช้คนเดิมกดคัดลอกซ้ำได้ไม่จำกัด แต่ยอดที่โชว์นับให้คนละ 1 เท่านั้น
--
-- ข้อมูลดิบทุกครั้งที่กดยังอยู่ครบใน usage_history ไฟล์นี้แค่คำนวณตัวเลขสรุปใหม่
-- จึงย้อนกลับไปเป็นแบบนับครั้งได้เสมอถ้าเปลี่ยนใจ

-- 1) คำนวณ copy_count ใหม่จากจำนวนผู้ใช้ที่ไม่ซ้ำ
update prompts p
set copy_count = coalesce((
  select count(distinct u.user_id)
  from usage_history u
  where u.prompt_id = p.prompt_id
    and u.action_type = 'copy'
    and u.user_id is not null
), 0);

-- 2) หน้ายอดนิยมต้องนับด้วยสูตรเดียวกัน ไม่งั้นตัวเลขสองหน้าจะขัดกันเอง
--    เดิมใช้ count(uh.history_id) = นับทุกครั้งที่กด
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
        count(distinct uh.user_id) filter (where uh.action_type = 'copy') as copy_uses
    from prompts p
    left join categories c on c.category_id = p.category_id
    left join media_types m on m.media_type_id = p.media_type_id
    left join usage_history uh on uh.prompt_id = p.prompt_id
    where p.is_public = true
    group by p.prompt_id, c.name, m.name
    order by copy_uses desc, p.copy_count desc
    limit result_limit;
$function$;
