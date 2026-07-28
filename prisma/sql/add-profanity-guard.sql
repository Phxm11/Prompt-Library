-- 🚫 ด่านกันคำไม่สุภาพที่ฐานข้อมูล
--
-- หน้าเว็บเขียนลง Supabase ตรง ๆ ด้วย token ของผู้ใช้เอง ไม่ได้ผ่าน API ของโปรเจกต์
-- ตัวกรองใน lib/profanity.ts จึงกันได้แค่คนที่ใช้หน้าเว็บตามปกติ ใครยิง PATCH เองก็ผ่านฉลุย
-- ไฟล์นี้คือด่านที่บังคับจริง ไม่ว่าจะเข้ามาทางไหน
--
-- คำทั้งหมดเก็บในตาราง profanity_words แล้ว sync มาจาก lib/profanity.ts
-- (รัน `node scripts/sync-profanity-words.mjs` หลังแก้ลิสต์ทุกครั้ง)

create table if not exists public.profanity_words (
  word text primary key,
  -- bad = คำหยาบ (เจอที่ไหนในข้อความก็ผิด), safe = คำสุภาพที่ตัวอักษรซ้อนกับคำหยาบ
  -- token = คำอังกฤษสั้นที่ต้องตรงทั้งคำ, reserved = ชื่อสงวนของระบบ
  kind text not null check (kind in ('bad', 'safe', 'token', 'reserved'))
);

comment on table public.profanity_words is
  'ลิสต์คำสำหรับ profanity_check() sync มาจาก lib/profanity.ts อย่าแก้มือ';

-- อ่านผ่านฟังก์ชัน security definer เท่านั้น ไม่ต้องเปิดให้ใครอ่านตรง ๆ
alter table public.profanity_words enable row level security;

/*
  ล้างข้อความให้เหลือรูปเดียวกับที่ฝั่งเว็บทำ
  พิมพ์เล็ก → แปลง leetspeak → เหลือแค่ a-z กับอักษรไทย → ยุบตัวซ้ำ
  "ค ว ย" / "ค.ว.ย" / "ควยยยย" / "f4ck" จึงกลายเป็นรูปเดียวกันหมด
  การตัดอักขระที่ไม่ใช่ a-z/ไทย ทำให้อักขระล่องหนที่แทรกมาเลี่ยงตัวกรองหายไปด้วยในตัว
*/
create or replace function public.profanity_normalize(t text)
returns text
language sql
immutable
as $$
  select regexp_replace(
           regexp_replace(
             translate(lower(coalesce(t, '')), '4@831!05$7+', 'aabeiiosstt'),
             '[^a-zก-๙]', '', 'g'
           ),
           '(.)\1+', '\1', 'g'
         );
$$;

/*
  ตรวจข้อความ คืนเหตุผลเป็นข้อความ หรือ null ถ้าผ่าน

  วิธีกันคำสุภาพที่ตัวอักษรซ้อนกับคำหยาบ (เช่น "หี" ที่อยู่ใน "หีบ")
  ใช้วิธีลบคำสุภาพออกจากข้อความก่อน แล้วค่อยหาคำหยาบในส่วนที่เหลือ
  ได้ผลเท่ากับฝั่ง TS ที่ไล่เช็คทีละตำแหน่ง แต่เขียนใน SQL ได้สั้นกว่ามาก
*/
create or replace function public.profanity_check(t text, check_reserved boolean default false)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  n text;
  cleaned text;
  stripped text;
  tokens text[];
  w text;
begin
  n := public.profanity_normalize(t);
  if n = '' then
    return null;
  end if;

  cleaned := n;
  for w in select word from public.profanity_words where kind = 'safe' loop
    cleaned := replace(cleaned, w, '');
  end loop;

  -- รอบปกติ
  if exists (
    select 1 from public.profanity_words
    where kind = 'bad' and position(word in cleaned) > 0
  ) then
    return 'มีคำไม่สุภาพ';
  end if;

  /*
    รอบตัดสระ/วรรณยุกต์ จับกรณีแทรกวรรณยุกต์รัว ๆ เพื่อเลี่ยง เช่น "ค๋ว๋ย๋"
    ใช้ได้เฉพาะคำที่ไม่มีวรรณยุกต์อยู่แล้วและยาว 3 ตัวขึ้นไป
    ไม่งั้นคำสั้นอย่าง "หี" จะเหลือ "ห" แล้วไปแมตช์คำปกติทุกคำที่มี ห
  */
  stripped := regexp_replace(cleaned, '[ัิ-ฺ็-๎]', '', 'g');
  if exists (
    select 1 from public.profanity_words
    where kind = 'bad'
      and length(word) >= 3
      and regexp_replace(word, '[ัิ-ฺ็-๎]', '', 'g') = word
      and position(word in stripped) > 0
  ) then
    return 'มีคำไม่สุภาพ';
  end if;

  -- คำอังกฤษสั้นที่ต้องตรงทั้งคำ เทียบกับข้อความที่ตัดเป็นคำ ๆ แล้ว
  tokens := regexp_split_to_array(
    translate(lower(coalesce(t, '')), '4@831!05$7+', 'aabeiiosstt'),
    '[^a-z]+'
  );
  if exists (
    select 1 from public.profanity_words
    where kind = 'token' and word = any(tokens)
  ) then
    return 'มีคำไม่สุภาพ';
  end if;

  if check_reserved and exists (
    select 1 from public.profanity_words
    where kind = 'reserved' and position(word in n) > 0
  ) then
    return 'เป็นชื่อสงวนของระบบ';
  end if;

  return null;
end;
$$;

-- ── ด่านของโปรไฟล์: ชื่อเล่น ชื่อผู้ใช้ ไบโอ ──
create or replace function public.enforce_clean_profile()
returns trigger
language plpgsql
as $$
declare
  problem text;
begin
  problem := public.profanity_check(new.display_name, true);
  if problem is not null then
    raise exception 'ชื่อเล่น%', problem using errcode = 'check_violation';
  end if;

  problem := public.profanity_check(new.username, true);
  if problem is not null then
    raise exception 'ชื่อผู้ใช้%', problem using errcode = 'check_violation';
  end if;

  problem := public.profanity_check(new.bio, false);
  if problem is not null then
    raise exception 'ไบโอ%', problem using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_clean_text on public.profiles;
create trigger trg_profiles_clean_text
  before insert or update of display_name, username, bio on public.profiles
  for each row
  execute function public.enforce_clean_profile();

-- ── ด่านของรีวิว: ข้อความรีวิว และชื่อผู้เยี่ยมชม ──
create or replace function public.enforce_clean_review()
returns trigger
language plpgsql
as $$
declare
  problem text;
begin
  problem := public.profanity_check(new.comment, false);
  if problem is not null then
    raise exception 'ข้อความรีวิว%', problem using errcode = 'check_violation';
  end if;

  problem := public.profanity_check(new.guest_name, true);
  if problem is not null then
    raise exception 'ชื่อผู้เขียน%', problem using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reviews_clean_text on public.reviews;
create trigger trg_reviews_clean_text
  before insert or update of comment, guest_name on public.reviews
  for each row
  execute function public.enforce_clean_review();
