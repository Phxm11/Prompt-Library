import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

const owner = '00000000-0000-4000-8000-000000000001'
const other = '00000000-0000-4000-8000-000000000002'
const admin = '00000000-0000-4000-8000-000000000003'
const prompt = '00000000-0000-4000-8000-000000000004'
const model = '00000000-0000-4000-8000-000000000005'
const guest = 'a'.repeat(64)
const stranger = 'b'.repeat(64)

async function fixture() {
  const db = new PGlite({ extensions: { pg_trgm } })
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create table profiles(id uuid primary key, username text, display_name text, avatar_url text, bio text, role text, is_banned boolean default false);
    create function is_admin() returns boolean language sql stable security definer as
      $$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;
    create function is_user_banned(uid uuid default auth.uid()) returns boolean language sql stable security definer as
      $$ select coalesce((select is_banned from public.profiles where id = uid), false) $$;
    create table prompts(prompt_id uuid primary key default gen_random_uuid(), user_id uuid references profiles,
      title varchar(255) not null, prompt_text text not null, negative_prompt text, description text,
      category_id uuid, media_type_id uuid, cover_image_url varchar(500), cover_position text default '50% 50%',
      cover_zoom numeric default 1, status text default 'published', is_public boolean default true,
      copy_count integer default 0, updated_at timestamptz default now());
    create table ai_models(ai_model_id uuid primary key);
    create table prompt_ai_models(prompt_id uuid references prompts on delete cascade, ai_model_id uuid references ai_models,
      primary key(prompt_id, ai_model_id));
    create table prompt_examples(example_id uuid primary key default gen_random_uuid(), prompt_id uuid references prompts,
      file_url varchar(500) not null, position text, zoom numeric, sort_order integer);
    create table reviews(review_id uuid primary key default gen_random_uuid(), prompt_id uuid references prompts,
      user_id uuid references profiles, guest_name varchar(50), rating smallint check (rating between 1 and 5),
      comment text, is_anonymous boolean not null default false, created_at timestamptz default now(), updated_at timestamptz default now());
    create table prompt_copies(copy_id uuid primary key default gen_random_uuid(), prompt_id uuid references prompts,
      user_id uuid references profiles, guest_id text, check(user_id is not null or guest_id is not null));
    create unique index on prompt_copies(user_id, prompt_id) where user_id is not null;
    create unique index on prompt_copies(guest_id, prompt_id) where guest_id is not null;
    create function increment_copy_count(prompt_id_input uuid) returns void language sql security definer as
      $$ update prompts set copy_count = copy_count + 1 where prompt_id = prompt_id_input $$;
    grant all on all tables in schema public to anon, authenticated, service_role;
    alter table reviews enable row level security;
    create policy legacy_open on reviews for all using (true) with check (true);
    alter table prompt_copies enable row level security;
    create policy legacy_open on prompt_copies for all using (true) with check (true);
    insert into profiles(id, username, role) values ('${owner}', 'owner', 'user'), ('${other}', 'other', 'user'), ('${admin}', 'admin', 'admin');
    insert into prompts(prompt_id,user_id,title,prompt_text) values ('${prompt}','${owner}','Original','Text');
    insert into ai_models values ('${model}');
  `)
  for (const file of ['add-profanity-guard.sql', 'harden-reviews-and-copies.sql', 'atomic-save-prompt.sql', 'search-indexes.sql']) {
    await db.exec(await readFile(new URL(`../prisma/sql/${file}`, import.meta.url), 'utf8'))
  }
  return db
}
async function asRole(db, role, user, fn) {
  await db.exec(`set role ${role}`)
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ''])
  try { return await fn() } finally { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', '', false)") }
}
async function review(db, action, user, hash, id = null, comment = 'Good') {
  return asRole(db, 'service_role', null, () => db.query(
    'select write_prompt_review($1,$2,$3,$4,$5,5,$6,\'Guest\',true,$7)',
    [action, prompt, id, user, hash, comment, 'c'.repeat(64)]))
}
async function readReviews(db, user, hash) {
  return asRole(db,'service_role',null, async () => (await db.query('select read_prompt_reviews($1,$2,$3) as result',[prompt,user,hash])).rows[0].result)
}
async function copy(db, user, hash, key = 'd'.repeat(64)) {
  return asRole(db,'service_role',null,async () => (await db.query('select record_prompt_copy($1,$2,$3,$4) as result',[prompt,user,hash,key])).rows[0].result)
}

test('database authorization, privacy, rate limiting and atomic saves', async t => {
  const db=await fixture()
  try {
    await t.test('anonymous author identity is absent; only owner receives management permission', async () => {
      await review(db,'create',owner,null)
      const visible=await readReviews(db,other,null)
      assert.equal(visible[0].profiles,null)
      assert.equal(visible[0].guest_name,null)
      assert.equal('user_id' in visible[0],false)
      assert.equal('guest_owner_hash' in visible[0],false)
      assert.equal(visible[0].can_manage,false)
      assert.equal((await readReviews(db,owner,null))[0].can_manage,true)
      const direct=await asRole(db,'authenticated',other,()=>db.query('select * from reviews'))
      assert.equal(direct.rows.length,0)
    })
    await t.test('guest ownership needs a secret; knowing public review ID is insufficient', async () => {
      await review(db,'create',null,guest)
      const mine=(await readReviews(db,null,guest)).find(r=>r.can_manage)
      assert.ok(mine)
      await assert.rejects(review(db,'update',null,stranger,mine.review_id),/not owned/)
      await assert.rejects(review(db,'delete',null,stranger,mine.review_id),/not owned/)
      const direct=await asRole(db,'anon',null,()=>db.query('delete from reviews where review_id=$1 returning review_id',[mine.review_id]))
      assert.equal(direct.rows.length,0)
      await review(db,'update',null,guest,mine.review_id,'Updated')
      assert.equal((await readReviews(db,null,guest)).find(r=>r.can_manage).comment,'Updated')
      await review(db,'delete',null,guest,mine.review_id)
    })
    await t.test('direct writes and service RPC impersonation are denied', async () => {
      await assert.rejects(asRole(db,'anon',null,()=>db.query('insert into reviews(prompt_id,rating) values ($1,5)',[prompt])),/row-level security/)
      await assert.rejects(asRole(db,'anon',null,()=>db.query('select read_prompt_reviews($1,$2,null)',[prompt,owner])),/permission denied/)
      await assert.rejects(asRole(db,'anon',null,()=>db.query('select record_prompt_copy($1,null,$2,$3)',[prompt,guest,guest])),/permission denied/)
      await assert.rejects(asRole(db,'anon',null,()=>db.query('insert into prompt_copies(prompt_id,guest_id) values ($1,$2)',[prompt,guest])),/permission denied/)
      await assert.rejects(asRole(db,'authenticated',owner,()=>db.query('select increment_copy_count($1)',[prompt])),/permission denied/)
      await assert.rejects(asRole(db,'authenticated',owner,()=>db.query('update prompts set copy_count=999 where prompt_id=$1',[prompt])),/server managed/)
    })
    await t.test('copy retries do not double count; count and ownership row roll back together', async () => {
      assert.equal((await copy(db,owner,null)).counted,true)
      assert.equal((await copy(db,owner,null)).counted,false)
      assert.equal((await copy(db,null,guest)).counted,true)
      assert.equal((await db.query('select copy_count from prompts where prompt_id=$1',[prompt])).rows[0].copy_count,2)
      await db.exec('alter table prompts add constraint test_counter_failure check(copy_count <= 2)')
      await assert.rejects(copy(db,other,null),/test_counter_failure/)
      assert.equal((await db.query('select count(*)::int n from prompt_copies')).rows[0].n,2)
      await db.exec('alter table prompts drop constraint test_counter_failure')
      assert.equal((await copy(db,other,null)).counted,true)
    })
    await t.test('shared database rate limit cannot be reset by changing guest IDs', async () => {
      const key='e'.repeat(64)
      for(let i=0;i<20;i++) assert.notEqual((await copy(db,null,i.toString(16).padStart(64,'0'),key)).rateLimited,true)
      assert.equal((await copy(db,null,'f'.repeat(64),key)).rateLimited,true)
    })
    await t.test('bans and profanity are enforced for service writes', async () => {
      await db.query('update profiles set is_banned=true where id=$1',[other])
      await assert.rejects(copy(db,other,null),/banned/)
      await assert.rejects(review(db,'create',other,null),/banned/)
      await db.exec("insert into profanity_words values (public.profanity_normalize('forbiddenword'), 'bad')")
      await assert.rejects(review(db,'create',owner,null,null,'forbiddenword'))
      await db.query('update profiles set is_banned=false where id=$1',[other])
    })
    await t.test('save is atomic, retryable and rejects other owners', async () => {
      const payload={title:'Saved',prompt_text:'Body',status:'published',is_public:true}
      const save=(user, models, examples=[])=>asRole(db,'authenticated',user,()=>db.query('select save_prompt($1,$2,$3,$4)',[prompt,payload,models,JSON.stringify(examples)]))
      await save(owner,[model],[{file_url:'https://example.test/image.png'}])
      await assert.rejects(save(other,[]),/Not owned/)
      payload.title='Must roll back'
      await assert.rejects(save(owner,[other]),/foreign key/)
      assert.equal((await db.query('select title from prompts where prompt_id=$1',[prompt])).rows[0].title,'Saved')
      assert.equal((await db.query('select count(*)::int n from prompt_ai_models')).rows[0].n,1)
      assert.equal((await db.query('select count(*)::int n from prompt_examples')).rows[0].n,1)
      await assert.rejects(save(owner,[],[{file_url:'x'.repeat(501)}]),/too long/)
      assert.equal((await db.query('select count(*)::int n from prompt_ai_models')).rows[0].n,1)
      payload.status='draft'
      await save(owner,[])
      assert.equal((await db.query('select is_public from prompts where prompt_id=$1',[prompt])).rows[0].is_public,false)
      await assert.rejects(readReviews(db,other,null),/not accessible/)
      await assert.rejects(copy(db,other,null),/not accessible/)
      assert.ok(await readReviews(db,owner,null))
    })
    await t.test('new saves are retryable and cannot transfer ownership or steal examples', async () => {
      const fresh='00000000-0000-4000-8000-000000000006'
      const failed='00000000-0000-4000-8000-000000000007'
      const payload={ title:'New', prompt_text:'Body', status:'published', is_public:true, user_id:other, copy_count:999 }
      const save=(id,models,examples=[])=>asRole(db,'authenticated',owner,()=>db.query('select save_prompt($1,$2,$3,$4)',[id,payload,models,JSON.stringify(examples)]))
      await assert.rejects(save(failed,[other]),/foreign key/)
      assert.equal((await db.query('select count(*)::int n from prompts where prompt_id=$1',[failed])).rows[0].n,0)
      await save(fresh,[model],[{file_url:'https://example.test/fresh.png'}])
      const example=(await db.query('select example_id from prompt_examples where prompt_id=$1',[fresh])).rows[0].example_id
      await save(fresh,[model],[{example_id:example,file_url:'https://example.test/fresh.png'}])
      const row=(await db.query('select user_id,copy_count from prompts where prompt_id=$1',[fresh])).rows[0]
      assert.equal(row.user_id,owner)
      assert.equal(row.copy_count,0)
      assert.equal((await db.query('select count(*)::int n from prompt_examples where prompt_id=$1',[fresh])).rows[0].n,1)
      await assert.rejects(save(prompt,[],[{example_id:example,file_url:'https://example.test/stolen.png'}]),/Example not owned/)
    })
    await t.test('admins retain direct moderation; legacy guests cannot claim ownership', async () => {
      await db.query('insert into reviews(prompt_id,rating) values ($1,5)',[prompt])
      const all=await asRole(db,'authenticated',admin,()=>db.query('select review_id from reviews'))
      assert.ok(all.rows.length>0)
      const legacy=(await db.query('select review_id from reviews where user_id is null and guest_owner_hash is null')).rows[0].review_id
      await db.query("update prompts set status='published', is_public=true where prompt_id=$1",[prompt])
      await assert.rejects(review(db,'delete',null,guest,legacy),/not owned/)
      const deleted=await asRole(db,'authenticated',admin,()=>db.query('delete from reviews where review_id=$1 returning review_id',[legacy]))
      assert.equal(deleted.rows.length,1)
    })
    await t.test('migration can be reapplied without dropping data', async () => {
      await db.exec(await readFile(new URL('../prisma/sql/harden-reviews-and-copies.sql',import.meta.url),'utf8'))
      assert.ok((await db.query('select count(*)::int n from reviews')).rows[0].n>0)
    })
  } finally { await db.close() }
})
