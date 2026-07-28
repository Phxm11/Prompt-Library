/*
  ส่งลิสต์คำจาก lib/profanity.ts ไปลงตาราง profanity_words ในฐานข้อมูล

  รันหลังแก้ลิสต์ทุกครั้ง:  node scripts/sync-profanity-words.mjs

  ลิสต์อยู่ที่ lib/profanity.ts ที่เดียว ฝั่ง DB เป็นสำเนาที่ generate มา
  ถ้าไม่รัน หน้าเว็บกับ trigger จะกันคนละชุดกัน
*/
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(pathToFileURL(process.cwd() + '/package.json'))
const pg = require('pg')

const { TH_BAD, TH_SAFE, EN_SUBSTR, EN_TOKEN, RESERVED } = await import(
  pathToFileURL(process.cwd() + '/lib/profanity.ts').href
)

// ต้องผ่านการล้างแบบเดียวกับตอนตรวจ ไม่งั้นคำที่มีเว้นวรรค/ตัวใหญ่จะไม่มีวันแมตช์
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[0-9@!$+]/g, (ch) => ({ 4: 'a', '@': 'a', 8: 'b', 3: 'e', 1: 'i', '!': 'i', 0: 'o', 5: 's', $: 's', 7: 't', '+': 't' })[ch] ?? '')
    .replace(/[^a-z฀-๿]/g, '')
    .replace(/(.)\1+/g, '$1')

const rows = new Map()
const add = (words, kind) => {
  for (const raw of words) {
    // token ต้องตรงทั้งคำ จึงเก็บรูปดิบ (พิมพ์เล็ก) ไม่ยุบตัวซ้ำ ไม่งั้น 'tits' จะกลายเป็น 'tis'
    const word = kind === 'token' ? raw.toLowerCase() : normalize(raw)
    if (word) rows.set(`${kind}:${word}`, { word, kind })
  }
}

add(TH_BAD, 'bad')
add(EN_SUBSTR, 'bad')
add(TH_SAFE, 'safe')
add(EN_TOKEN, 'token')
add(RESERVED, 'reserved')

// คำเดียวกันอยู่ได้ชนิดเดียวเพราะ word เป็น primary key — ให้ safe ชนะ จะได้ไม่แบนคำสุภาพ
const byWord = new Map()
for (const { word, kind } of rows.values()) {
  const current = byWord.get(word)
  if (!current || kind === 'safe') byWord.set(word, kind)
}
const finalRows = [...byWord.entries()].map(([word, kind]) => ({ word, kind }))

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    })
)

const client = new pg.Client({
  connectionString: env.DIRECT_URL ?? env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
try {
  await client.query('begin')
  await client.query('delete from public.profanity_words')
  await client.query(
    'insert into public.profanity_words (word, kind) select * from unnest($1::text[], $2::text[])',
    [finalRows.map((r) => r.word), finalRows.map((r) => r.kind)]
  )
  await client.query('commit')
} catch (err) {
  await client.query('rollback')
  throw err
} finally {
  await client.end()
}

const count = (kind) => finalRows.filter((r) => r.kind === kind).length
console.log(
  `sync แล้ว ${finalRows.length} คำ — bad ${count('bad')}, safe ${count('safe')}, ` +
    `token ${count('token')}, reserved ${count('reserved')}`
)
