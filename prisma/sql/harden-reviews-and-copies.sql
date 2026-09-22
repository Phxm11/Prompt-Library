-- Apply after the existing prisma/sql scripts, before deploying the new app.
-- Preserves existing reviews; legacy guest reviews become admin-managed because
-- their public review IDs cannot prove ownership. Requires service_role on server.
begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table if not exists app_private.action_limits (
  bucket text primary key,
  started_at timestamptz not null,
  hits integer not null
);
create index if not exists action_limits_expiry on app_private.action_limits(started_at);
revoke all on app_private.action_limits from public, anon, authenticated;

create or replace function app_private.consume_limit(key text, max_hits integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if key is null or length(key) <> 64 then raise exception 'Invalid rate key'; end if;
  delete from app_private.action_limits where started_at < now() - interval '1 day';
  insert into app_private.action_limits as limits values (key, now(), 1)
  on conflict (bucket) do update set
    hits = case when limits.started_at <= now() - interval '1 minute' then 1 else limits.hits + 1 end,
    started_at = case when limits.started_at <= now() - interval '1 minute' then now() else limits.started_at end
  returning hits into n;
  return n <= max_hits;
end;
$$;
revoke all on function app_private.consume_limit(text, integer) from public, anon, authenticated;

-- Restrictive policies also constrain any pre-existing permissive policies.
alter table public.reviews add column if not exists guest_owner_hash text;
alter table public.reviews enable row level security;
drop policy if exists reviews_read_private on public.reviews;
create policy reviews_read_private on public.reviews as restrictive for select to anon, authenticated
  using (auth.uid() = user_id or public.is_admin());
drop policy if exists reviews_server_insert on public.reviews;
create policy reviews_server_insert on public.reviews as restrictive for insert to anon, authenticated with check (false);
drop policy if exists reviews_server_update on public.reviews;
create policy reviews_server_update on public.reviews as restrictive for update to anon, authenticated using (false) with check (false);
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews as restrictive for delete to anon, authenticated using (public.is_admin());

-- Move secret hashes out of exposed columns: direct SELECT is available only to
-- admins and member owners; member reviews never receive a guest hash.
create or replace function public.read_prompt_reviews(target_prompt uuid, actor_id uuid, guest_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.prompts p where p.prompt_id = target_prompt
    and ((p.is_public and p.status = 'published') or p.user_id = actor_id)) then
    raise exception 'Prompt not accessible';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'review_id', r.review_id, 'rating', r.rating, 'comment', r.comment,
    'created_at', r.created_at, 'is_anonymous', r.is_anonymous,
    'guest_name', case when r.is_anonymous then null else r.guest_name end,
    'is_member', r.user_id is not null,
    'can_manage', coalesce(r.user_id = actor_id or
      (actor_id is null and r.user_id is null and r.guest_owner_hash = guest_hash), false),
    'profiles', case when r.is_anonymous or p.id is null then null else
      jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url) end
  ) order by r.created_at desc, r.review_id)
  from public.reviews r left join public.profiles p on p.id = r.user_id
  where r.prompt_id = target_prompt), '[]'::jsonb);
end;
$$;

create or replace function public.write_prompt_review(
  operation text, target_prompt uuid, target_review uuid, actor_id uuid, guest_hash text,
  new_rating integer, new_comment text, new_guest_name text, hide_author boolean, bucket_key text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if operation is null or operation not in ('create', 'update', 'delete') then raise exception 'Invalid operation'; end if;
  if actor_id is null and (guest_hash is null or guest_hash !~ '^[a-f0-9]{64}$') then raise exception 'Missing owner'; end if;
  if public.is_user_banned(actor_id) then raise exception 'Account banned'; end if;
  if not exists (select 1 from public.prompts p where p.prompt_id = target_prompt
    and ((p.is_public and p.status = 'published') or p.user_id = actor_id)) then raise exception 'Prompt not accessible'; end if;
  if operation <> 'delete' and (new_rating is null or new_rating not between 1 and 5
    or length(coalesce(new_comment, '')) > 5000 or length(coalesce(new_guest_name, '')) > 50) then
    raise exception 'Invalid review';
  end if;
  if not app_private.consume_limit(bucket_key, 10) then raise exception 'Too many requests'; end if;
  if operation = 'create' then
    insert into public.reviews(prompt_id, user_id, guest_owner_hash, guest_name, rating, comment, is_anonymous)
    values (target_prompt, actor_id, case when actor_id is null then guest_hash end,
      case when actor_id is null then coalesce(nullif(trim(new_guest_name), ''), 'ผู้เยี่ยมชม') end,
      new_rating, nullif(trim(new_comment), ''), actor_id is null or coalesce(hide_author, true));
  else
    -- Lock and authorize before changing anything, including anonymous reviews.
    perform 1 from public.reviews r where r.review_id = target_review and r.prompt_id = target_prompt
      and ((actor_id is not null and r.user_id = actor_id) or
        (actor_id is null and r.user_id is null and r.guest_owner_hash = guest_hash)) for update;
    if not found then raise exception 'Review not owned'; end if;
    if operation = 'delete' then
      delete from public.reviews where review_id = target_review;
    else
      update public.reviews set rating = new_rating, comment = nullif(trim(new_comment), ''),
        is_anonymous = actor_id is null or coalesce(hide_author, true), updated_at = now()
      where review_id = target_review;
    end if;
  end if;
end;
$$;

-- The old anonymous INSERT path and counter RPC must not bypass the server gate.
alter table public.prompt_copies enable row level security;
drop policy if exists copies_server_only on public.prompt_copies;
create policy copies_server_only on public.prompt_copies as restrictive for all to anon, authenticated using (false) with check (false);
revoke insert, update, delete on public.prompt_copies from public, anon, authenticated;
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'increment_copy_count'
  loop execute format('revoke all on function %s from public, anon, authenticated', f.signature); end loop;
end;
$$;

create or replace function public.record_prompt_copy(target_prompt uuid, actor_id uuid, guest_hash text, bucket_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare inserted integer;
begin
  if actor_id is null and (guest_hash is null or guest_hash !~ '^[a-f0-9]{64}$') then raise exception 'Missing owner'; end if;
  if public.is_user_banned(actor_id) then raise exception 'Account banned'; end if;
  if not app_private.consume_limit(bucket_key, 20) then return jsonb_build_object('counted', false, 'rateLimited', true); end if;
  perform 1 from public.prompts p where p.prompt_id = target_prompt
    and ((p.is_public and p.status = 'published') or p.user_id = actor_id) for update;
  if not found then raise exception 'Prompt not accessible'; end if;
  insert into public.prompt_copies(prompt_id, user_id, guest_id)
    values (target_prompt, actor_id, case when actor_id is null then guest_hash end) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted > 0 then
    update public.prompts set copy_count = (select count(*) from public.prompt_copies where prompt_id = target_prompt)
    where prompt_id = target_prompt;
  end if;
  return jsonb_build_object('counted', inserted > 0);
end;
$$;

-- Prevent owners from altering their own public counter through a direct UPDATE.
create or replace function app_private.protect_copy_count()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if (tg_op = 'INSERT' and coalesce(new.copy_count, 0) <> 0) or
       (tg_op = 'UPDATE' and new.copy_count is distinct from old.copy_count) then
      raise exception 'Copy count is server managed';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_copy_count on public.prompts;
create trigger protect_copy_count before insert or update on public.prompts
for each row execute function app_private.protect_copy_count();

-- Only the server's service role may supply a verified actor or guest hash.
revoke all on function public.read_prompt_reviews(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.write_prompt_review(text, uuid, uuid, uuid, text, integer, text, text, boolean, text) from public, anon, authenticated;
revoke all on function public.record_prompt_copy(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.read_prompt_reviews(uuid, uuid, text) to service_role;
grant execute on function public.write_prompt_review(text, uuid, uuid, uuid, text, integer, text, text, boolean, text) to service_role;
grant execute on function public.record_prompt_copy(uuid, uuid, text, text) to service_role;

notify pgrst, 'reload schema';
commit;
