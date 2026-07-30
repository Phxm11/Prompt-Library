-- ให้ผู้ใช้เปลี่ยน username เองได้ แต่เปลี่ยนได้ทุก 14 วัน
--
-- ทำเป็น trigger ที่ฐานข้อมูล ไม่ใช่เช็คแค่ในหน้าเว็บ
-- เพราะ PostgREST เปิดให้ยิง PATCH ตรงได้ด้วย token ของผู้ใช้เอง
-- ถ้ากติกาอยู่แต่ในหน้าเว็บ ใครยิงเองก็เปลี่ยนรัวได้ทุกวินาที
--
-- ตรวจความยาว/รูปแบบเฉพาะ "ตอนเปลี่ยน" ไม่ได้ทำเป็น check constraint ของคอลัมน์
-- เพราะ handle_new_user ตอนสมัครตั้ง username จากหน้าอีเมลตรง ๆ
-- ซึ่งยาวเกิน 15 หรือมีตัวใหญ่/อักขระอื่นได้ ถ้าใส่ constraint ทั้งคอลัมน์ การสมัครจะพังทันที

alter table public.profiles
  add column if not exists username_changed_at timestamptz;

comment on column public.profiles.username_changed_at is
  'ครั้งล่าสุดที่เปลี่ยน username, null = ยังไม่เคยเปลี่ยน (เปลี่ยนได้เลย)';

create or replace function public.enforce_username_change_rules()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    if char_length(new.username) < 3 or char_length(new.username) > 15 then
      raise exception 'ชื่อผู้ใช้ต้องยาว 3-15 ตัวอักษร'
        using errcode = 'check_violation';
    end if;

    if new.username !~ '^[a-z0-9._-]+$' then
      raise exception 'ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 จุด ขีดล่าง และขีดกลาง'
        using errcode = 'check_violation';
    end if;

    -- null = ยังไม่เคยเปลี่ยน ให้ผ่านได้เลย
    if old.username_changed_at is not null
       and old.username_changed_at > now() - interval '14 days' then
      raise exception 'เปลี่ยนชื่อผู้ใช้ได้ทุก 14 วัน เปลี่ยนได้อีกครั้งวันที่ %',
        to_char(old.username_changed_at + interval '14 days', 'DD/MM/YYYY')
        using errcode = 'check_violation';
    end if;

    new.username_changed_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_username_rules on public.profiles;
create trigger trg_profiles_username_rules
  before update on public.profiles
  for each row
  execute function public.enforce_username_change_rules();
