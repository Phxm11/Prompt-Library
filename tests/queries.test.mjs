import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { Script } from 'node:vm'
import ts from 'typescript'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)
async function loadTs(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const exports = {}
  const execute = new Script(`(function(require,exports){${compiled}\n})`).runInThisContext()
  execute(name => imports[name] ?? require(name), exports)
  return exports
}
const search = await loadTs('../lib/promptSearch.ts')
const { promptPageQuery, PAGE_SIZE } = await loadTs('../lib/promptQuery.ts', { './promptSearch': search })

test('search values quote grammar delimiters and preserve Thai text', () => {
  assert.equal(search.promptSearchFilter('ภาพ (แมว, หมา)'),
    'title.ilike."%ภาพ (แมว, หมา)%",description.ilike."%ภาพ (แมว, หมา)%",prompt_text.ilike."%ภาพ (แมว, หมา)%"')
  const encoded = search.promptSearchFilter('50%_"\\')
  assert.ok(encoded.includes('50\\\\%\\\\_\\"\\\\\\\\'))
})

test('pagination uses a filtered join, a lookahead row, and deterministic ordering', async () => {
  let requestUrl
  const client=createClient('https://example.supabase.co','test-key',{
    global: { fetch: async url => { requestUrl = new URL(url); return new Response('[]', { status: 200, headers: { 'Content-Type':'application/json' } }) } },
    auth:{persistSession:false,autoRefreshToken:false},
  })
  await promptPageQuery(client,{ aiModelId:'model', categoryId:'category',mediaTypeId:'media',query:'แมว' },24)
  assert.equal(requestUrl.searchParams.get('select').includes('prompt_ai_models!inner(ai_model_id)'),true)
  assert.equal(requestUrl.searchParams.get('prompt_ai_models.ai_model_id'),'eq.model')
  assert.equal(requestUrl.searchParams.get('category_id'),'eq.category')
  assert.equal(requestUrl.searchParams.get('media_type_id'),'eq.media')
  assert.equal(requestUrl.searchParams.get('status'),'eq.published')
  assert.equal(requestUrl.searchParams.get('is_public'),'eq.true')
  assert.equal(requestUrl.searchParams.get('offset'),'24')
  assert.equal(requestUrl.searchParams.get('limit'),String(PAGE_SIZE+1))
  assert.equal(requestUrl.searchParams.get('order'),'created_at.desc,prompt_id.asc')
})
