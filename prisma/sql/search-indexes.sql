-- Match the application's ILIKE substring search and model-filter joins.
-- Run on a staging database first: regular CREATE INDEX takes a write lock.
begin;
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
do $$
declare ext_schema text;
begin
  select n.nspname into ext_schema from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_trgm';
  execute format('create index if not exists idx_prompts_title_trgm on public.prompts using gin (title %I.gin_trgm_ops)', ext_schema);
  execute format('create index if not exists idx_prompts_description_trgm on public.prompts using gin (description %I.gin_trgm_ops)', ext_schema);
  execute format('create index if not exists idx_prompts_text_trgm on public.prompts using gin (prompt_text %I.gin_trgm_ops)', ext_schema);
end;
$$;
create index if not exists idx_prompt_ai_models_model_prompt on public.prompt_ai_models(ai_model_id, prompt_id);
commit;
