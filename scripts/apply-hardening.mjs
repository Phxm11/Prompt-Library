import { readFile } from 'node:fs/promises'
import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local', quiet: true })
const connectionString = process.env.DIRECT_URL
if (!connectionString) {
  console.error('Set DIRECT_URL in .env.local before checking or applying database updates.')
  process.exit(1)
}
const checkOnly = process.argv.includes('--check')
const files = ['harden-reviews-and-copies.sql', 'atomic-save-prompt.sql', 'search-indexes.sql']
const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000 })
try {
  await client.connect()
  const { rows } = await client.query(`
    select tablename, policyname, cmd, permissive, qual, with_check
    from pg_policies where schemaname = 'public' and tablename in ('reviews','prompt_copies','prompts')
    order by tablename, policyname
  `)
  if (checkOnly) {
    console.log(JSON.stringify(rows, null, 2))
  } else {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing server service role key')
    // Commit the complete upgrade together; a failure leaves the old schema intact.
    await client.query('begin')
    await client.query("set local lock_timeout = '10s'")
    for (const file of files) {
      const source = await readFile(new URL(`../prisma/sql/${file}`, import.meta.url), 'utf8')
      await client.query(source.replace(/^begin;\s*$/gm, '').replace(/^commit;\s*$/gm, ''))
      console.log(`Prepared ${file}`)
    }
    await client.query('commit')
    console.log('Database updates committed. Deploy the matching application next.')
  }
} catch (error) {
  await client.query('rollback').catch(() => {})
  // Never print connection strings or server credentials in command output.
  console.error('Database update failed:', error.code ?? error.name)
  process.exitCode = 1
} finally {
  await client.end()
}
