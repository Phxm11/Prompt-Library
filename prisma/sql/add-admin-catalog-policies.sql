-- เปิดให้แอดมินจัดการตารางอ้างอิง (categories, media_types, ai_models, tags) ผ่านหน้าเว็บได้
--
-- ก่อนหน้านี้ 4 ตารางนี้ไม่มี insert/update/delete policy เลยแม้แต่อันเดียว
-- (ต่างจากตารางที่ผู้ใช้ทั่วไปเขียนได้ เช่น prompts/reviews ที่มี policy ของตัวเองอยู่แล้ว)
-- เพราะตอนออกแบบระบบตั้งใจให้แก้ผ่าน SQL ตรง ๆ เท่านั้น ตอนนี้เปลี่ยนมาทำผ่านหน้า /admin/catalog แทน
-- จึงต้องเปิดสิทธิ์เขียนให้เฉพาะแอดมิน (ใช้ public.is_admin() ตัวเดียวกับที่ ban_user/set_user_role ใช้)
--
-- การอ่าน (select) ของ 4 ตารางนี้ไม่แตะต้อง ยังเปิดให้ทุกคนอ่านได้ตามเดิม

do $$
declare
  t text;
begin
  foreach t in array array['categories', 'media_types', 'ai_models', 'tags']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists admin_write_insert on public.%I', t);
    execute format('drop policy if exists admin_write_update on public.%I', t);
    execute format('drop policy if exists admin_write_delete on public.%I', t);

    execute format($f$
      create policy admin_write_insert on public.%I
        for insert
        with check (public.is_admin())
    $f$, t);

    execute format($f$
      create policy admin_write_update on public.%I
        for update
        using (public.is_admin())
        with check (public.is_admin())
    $f$, t);

    execute format($f$
      create policy admin_write_delete on public.%I
        for delete
        using (public.is_admin())
    $f$, t);
  end loop;
end;
$$;
