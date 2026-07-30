'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SearchBox, { type Suggestion } from '@/app/components/SearchBox'
import { promptSearchFilter } from '@/lib/promptSearch'

// คำนำหน้าที่ใช้แยกว่ารายการแนะนำอันนี้เป็นคนหรือเป็น prompt ตอนกดเลือก
const USER_PREFIX = 'user:'
const PROMPT_PREFIX = 'prompt:'

/** ความกว้างมาจาก element แม่เสมอ ตัวมันเองยืดเต็มที่ที่ได้มา */
export default function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter()
  const supabase = createClient()

  /*
    รายการแนะนำมีสองชนิดปนกัน คือคนกับ prompt แยกกันด้วยคำนำหน้าใน id
    คนขึ้นก่อนเพราะมีน้อยและตรงตัวกว่า แล้วดูออกทันทีจากรูปกลมหน้ารายการ

    ฝั่ง prompt ใช้เงื่อนไขชุดเดียวกับหน้า /search รายการแนะนำจึงเป็นผลการค้นหาจริง ๆ
  */
  async function fetchSuggestions(keyword: string): Promise<Suggestion[]> {
    const escaped = keyword.replace(/[%_\\]/g, (ch) => `\\${ch}`).replace(/,/g, '')

    const [promptResult, userResult] = await Promise.all([
      supabase
        .from('prompts')
        .select('prompt_id, title, categories(name)')
        .eq('is_public', true)
        .or(promptSearchFilter(keyword))
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .or(`username.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
        .limit(3),
    ])

    const users = ((userResult.data ?? []) as {
      username: string
      display_name: string | null
      avatar_url: string | null
    }[]).map((row) => ({
      id: `${USER_PREFIX}${row.username}`,
      label: row.display_name?.trim() || row.username,
      hint: `@${row.username}`,
      avatarUrl: row.avatar_url,
    }))

    const prompts = ((promptResult.data ?? []) as unknown as {
      prompt_id: string
      title: string
      categories: { name: string } | null
    }[]).map((row) => ({
      id: `${PROMPT_PREFIX}${row.prompt_id}`,
      label: row.title,
      hint: row.categories?.name ?? undefined,
    }))

    return [...users, ...prompts]
  }

  return (
    <SearchBox
      value={initialQuery}
      placeholder="ค้นหา prompt..."
      // compact = อยู่บน navbar ให้กว้างเท่าที่ช่องว่างเหลือ ตัวแม่เป็นคนคุมความกว้าง
      className="w-full"
      fetchSuggestions={fetchSuggestions}
      // เลือกรายการแนะนำ = รู้อยู่แล้วว่าจะเอาอันไหน พาไปหน้านั้นเลยไม่ต้องผ่านหน้าผลค้นหา
      onPick={(item) =>
        router.push(
          item.id.startsWith(USER_PREFIX)
            ? `/u/${encodeURIComponent(item.id.slice(USER_PREFIX.length))}`
            : `/prompts/${item.id.slice(PROMPT_PREFIX.length)}`
        )
      }
      onSearch={(kw) => {
        if (kw) router.push(`/search?q=${encodeURIComponent(kw)}`)
      }}
    />
  )
}
