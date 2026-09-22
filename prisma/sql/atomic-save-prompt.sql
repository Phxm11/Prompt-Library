-- Authenticated RPC: atomically saves the prompt and its related rows.
begin;
create or replace function public.save_prompt(
  target_prompt uuid, payload jsonb, model_ids uuid[], examples jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  existing_owner uuid;
  item jsonb;
  example_uuid uuid;
  kept uuid[] := '{}';
  position_index integer := 0;
  desired_status text := payload->>'status';
begin
  if uid is null or public.is_user_banned(uid) then raise exception 'Not authorized'; end if;
  if target_prompt is null or jsonb_typeof(payload) is distinct from 'object'
    or jsonb_typeof(examples) is distinct from 'array' then raise exception 'Invalid payload'; end if;
  if coalesce(length(trim(payload->>'title')), 0) not between 1 and 255
    or coalesce(length(trim(payload->>'prompt_text')), 0) not between 1 and 100000
    or desired_status is null or desired_status not in ('draft', 'published')
    or cardinality(model_ids) > 100 or jsonb_array_length(examples) > 30 then raise exception 'Invalid prompt'; end if;
  -- Serialize create/retry and edits of this ID, even before a row exists.
  perform pg_advisory_xact_lock(hashtextextended(target_prompt::text, 0));
  select user_id into existing_owner from public.prompts where prompt_id = target_prompt for update;
  if found then
    if existing_owner is distinct from uid and not exists (select 1 from public.profiles where id = uid and role = 'admin') then raise exception 'Not owned'; end if;
  else
    insert into public.prompts(prompt_id, user_id, title, prompt_text, status, is_public)
      values (target_prompt, uid, trim(payload->>'title'), trim(payload->>'prompt_text'), 'draft', false);
  end if;
  update public.prompts set
    title = trim(payload->>'title'), prompt_text = trim(payload->>'prompt_text'),
    negative_prompt = nullif(payload->>'negative_prompt', ''), description = nullif(payload->>'description', ''),
    category_id = nullif(payload->>'category_id', '')::uuid, media_type_id = nullif(payload->>'media_type_id', '')::uuid,
    cover_image_url = nullif(payload->>'cover_image_url', ''),
    cover_position = coalesce(payload->>'cover_position', '50% 50%'),
    cover_zoom = coalesce((payload->>'cover_zoom')::numeric, 1),
    status = desired_status,
    is_public = desired_status = 'published' and coalesce((payload->>'is_public')::boolean, false), updated_at = now()
  where prompt_id = target_prompt;

  delete from public.prompt_ai_models where prompt_id = target_prompt;
  insert into public.prompt_ai_models(prompt_id, ai_model_id)
    select target_prompt, id from (select distinct unnest(coalesce(model_ids, '{}'::uuid[])) id) models;
  for item in select value from jsonb_array_elements(examples) loop
    example_uuid := coalesce(nullif(item->>'example_id', '')::uuid, gen_random_uuid());
    if example_uuid = any(kept) then raise exception 'Duplicate example'; end if;
    if exists (select 1 from public.prompt_examples where example_id = example_uuid and prompt_id is distinct from target_prompt) then
      raise exception 'Example not owned';
    end if;
    insert into public.prompt_examples(example_id, prompt_id, file_url, position, zoom, sort_order)
    values (example_uuid, target_prompt, item->>'file_url', coalesce(item->>'position', '50% 50%'),
      coalesce((item->>'zoom')::numeric, 1), position_index)
    on conflict (example_id) do update set file_url = excluded.file_url, position = excluded.position,
      zoom = excluded.zoom, sort_order = excluded.sort_order;
    kept := array_append(kept, example_uuid);
    position_index := position_index + 1;
  end loop;
  delete from public.prompt_examples where prompt_id = target_prompt and not (example_id = any(kept));
  return target_prompt;
end;
$$;
revoke all on function public.save_prompt(uuid, jsonb, uuid[], jsonb) from public, anon;
grant execute on function public.save_prompt(uuid, jsonb, uuid[], jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
