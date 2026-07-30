'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SelectMenu from '@/app/components/SelectMenu'
import SearchBox, { type Suggestion } from '@/app/components/SearchBox'

const ROLE_OPTIONS = [
  { value: 'user', label: 'ผู้ใช้ทั่วไป' },
  { value: 'admin', label: 'แอดมิน' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'ปกติ' },
  { value: 'banned', label: 'ถูกแบน' },
]

export default function AdminUserFilters({ total }: { total: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const role = searchParams.get('role') ?? ''
  const status = searchParams.get('status') ?? ''
  const q = searchParams.get('q') ?? ''
  const activeCount = [role, status, q].filter(Boolean).length

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)

    const query = params.toString()
    router.push(query ? `/admin/users?${query}` : '/admin/users')
  }

  /*
    รายการแนะนำดึงจากผู้ใช้จริงในฐานข้อมูล เอาแค่ 6 รายการพอไม่ให้ลิสต์ยาวเกิน
    ต้อง escape % _ \ ก่อน เพราะเป็นอักขระพิเศษของ LIKE
    และตัด , ทิ้ง เพราะ .or() ใช้จุลภาคคั่นเงื่อนไข ถ้าไม่กันจะแตกเป็นสองเงื่อนไข
  */
  async function fetchSuggestions(keyword: string): Promise<Suggestion[]> {
    const escaped = keyword.replace(/[%_\\]/g, (ch) => `\\${ch}`).replace(/,/g, '')
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .or(`username.ilike.%${escaped}%,display_name.ilike.%${escaped}%`)
      .order('created_at', { ascending: false })
      .limit(6)

    return ((data ?? []) as {
      id: string
      username: string
      display_name: string | null
    }[]).map((row) => ({
      id: row.id,
      label: row.display_name || row.username,
      hint: `@${row.username}`,
    }))
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <SearchBox
        value={q}
        placeholder="ค้นหาชื่อผู้ใช้..."
        onSearch={(kw) => updateParam('q', kw || null)}
        fetchSuggestions={fetchSuggestions}
      />

      <SelectMenu
        className="w-44"
        ariaLabel="กรองตามสิทธิ์"
        placeholder="ทุกสิทธิ์"
        value={role}
        onChange={(v) => updateParam('role', v || null)}
        options={ROLE_OPTIONS}
      />

      <SelectMenu
        className="w-40"
        ariaLabel="กรองตามสถานะ"
        placeholder="ทุกสถานะ"
        value={status}
        onChange={(v) => updateParam('status', v || null)}
        options={STATUS_OPTIONS}
      />

      <span className="font-mono text-xs text-faint">พบ {total} คน</span>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => router.push('/admin/users')}
          className="font-mono text-xs text-accent2 hover:opacity-80"
        >
          ✕ ล้างตัวกรอง ({activeCount})
        </button>
      )}
    </div>
  )
}
