-- ทำให้การแบนมีผลจริง + แบนแบบมีกำหนดวันได้
--
-- ของเดิม ban_user() แค่ตั้ง is_banned = true เฉย ๆ ไม่มีอะไรในระบบอ่านค่านั้นเลย
-- คนที่โดนแบนจึงยังโพสต์ prompt เขียนรีวิว กดถูกใจได้ตามปกติทุกอย่าง
--
-- ไฟล์นี้เพิ่มสามอย่าง
--   1) banned_until  = แบนถึงเมื่อไหร่ (null = ถาวร) หมดเวลาแล้วกลับมาใช้ได้เองโดยไม่ต้องรอแอดมิน
--   2) is_user_banned() = ตัวตัดสินว่าตอนนี้โดนแบนอยู่จริงไหม
--   3) restrictive policy บนทุกตารางที่ผู้ใช้เขียนได้ = ด่านบังคับจริงที่ชั้นฐานข้อมูล

alter table public.profiles
  add column if not exists banned_until timestamptz;

comment on column public.profiles.banned_until is
  'แบนถึงเมื่อไหร่ null = ถาวร (ดูคู่กับ is_banned เสมอ)';

/*
  ตัวตัดสินว่า "ตอนนี้" โดนแบนอยู่ไหม

  security definer เพราะต้องอ่าน profiles ของคนอื่นได้โดยไม่ติด RLS ของตัวเอง
  ถ้าไม่ใส่จะวนเป็นงูกินหางตอนเอาไปใช้ใน policy ของ profiles เอง

  ไม่ล็อกอิน (auth.uid() เป็น null) = ไม่ได้โดนแบน ผู้เยี่ยมชมจึงยังรีวิวได้เหมือนเดิม
*/
create or replace function public.is_user_banned(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and is_banned = true
      and (banned_until is null or banned_until > now())
  );
$$;

-- ── แบน: days = null คือถาวร ──
drop function if exists public.ban_user(uuid, text);

create or replace function public.ban_user(
  target_user_id uuid,
  reason text default null,
  days integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: admin only';
  end if;

  -- เพดาน 3650 วัน (10 ปี) ต้องตรงกับ MAX_DAYS ในหน้าเว็บ
  -- ไม่ใช่แค่กันพิมพ์พลาด แต่กันค่ามหาศาลที่ทำให้ make_interval พังด้วย
  if days is not null and (days < 1 or days > 3650) then
    raise exception 'จำนวนวันต้องอยู่ระหว่าง 1-3650 วัน' using errcode = 'check_violation';
  end if;

  -- กันแอดมินแบนตัวเองแล้วแก้คืนไม่ได้ (โดนแบนแล้วแก้ profiles ไม่ได้ตาม policy ข้างล่าง)
  if target_user_id = auth.uid() then
    raise exception 'แบนตัวเองไม่ได้' using errcode = 'check_violation';
  end if;

  update profiles
  set is_banned = true,
      banned_reason = reason,
      banned_at = now(),
      banned_until = case when days is null then null else now() + make_interval(days => days) end
  where id = target_user_id;
end;
$$;

-- ── ปลดแบน: ล้างทุกอย่างให้กลับเป็นบัญชีปกติ ──
create or replace function public.unban_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: admin only';
  end if;

  update profiles
  set is_banned = false,
      banned_reason = null,
      banned_at = null,
      banned_until = null
  where id = target_user_id;
end;
$$;

/*
  ด่านบังคับจริง

  ต้องเป็น restrictive ไม่ใช่ permissive เพราะตารางพวกนี้มี policy ซ้อนกันหลายอันจากของเก่า
  policy แบบ permissive จะ OR กัน ต่อให้แก้อันหนึ่งให้กันคนโดนแบน อีกอันก็ปล่อยผ่านอยู่ดี
  ส่วน restrictive จะ AND กับทุกอัน ไม่ว่าจะมี policy อื่นกี่อันก็ผ่านไม่ได้

  ตั้งเฉพาะคำสั่งที่เป็นการเขียน ส่วนการอ่านยังเปิดตามปกติ คนโดนแบนจึงยังเข้ามาดูเว็บได้
*/
do $$
declare
  t text;
begin
  foreach t in array array[
    'prompts', 'reviews', 'favorites', 'prompt_examples',
    'prompt_tags', 'prompt_ai_models', 'prompt_copies', 'profiles'
  ]
  loop
    execute format('drop policy if exists banned_no_insert on public.%I', t);
    execute format('drop policy if exists banned_no_update on public.%I', t);
    execute format('drop policy if exists banned_no_delete on public.%I', t);

    -- แยกทีละคำสั่ง ไม่ใช้ for all เพราะ for all จะไปคุม select ด้วย
    -- แล้วคนโดนแบนจะเปิดเว็บมาเจอหน้าว่างเปล่าจนไม่รู้ว่าเกิดอะไรขึ้น
    execute format($f$
      create policy banned_no_insert on public.%I
        as restrictive for insert
        with check (not public.is_user_banned())
    $f$, t);

    execute format($f$
      create policy banned_no_update on public.%I
        as restrictive for update
        using (not public.is_user_banned())
        with check (not public.is_user_banned())
    $f$, t);

    execute format($f$
      create policy banned_no_delete on public.%I
        as restrictive for delete
        using (not public.is_user_banned())
    $f$, t);
  end loop;
end;
$$;
