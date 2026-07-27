'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminUserActionsProps = {
  userId: string
  currentRole: string
  isBanned: boolean
}

export default function AdminUserActions({ userId, currentRole, isBanned }: AdminUserActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [busy, setBusy] = useState(false)

  async function handleRoleChange(newRole: string) {
    setBusy(true)
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: newRole,
    })
    if (error) alert('เปลี่ยน role ไม่สำเร็จ: ' + error.message)
    router.refresh()
    setBusy(false)
  }

  async function handleBanToggle() {
    setBusy(true)
    if (isBanned) {
      const { error } = await supabase.rpc('unban_user', { target_user_id: userId })
      if (error) alert('ปลดแบนไม่สำเร็จ: ' + error.message)
    } else {
      const reason = prompt('เหตุผลในการแบน (ไม่บังคับ):') ?? ''
      const { error } = await supabase.rpc('ban_user', {
        target_user_id: userId,
        reason: reason || null,
      })
      if (error) alert('แบนไม่สำเร็จ: ' + error.message)
    }
    router.refresh()
    setBusy(false)
  }

  const selectClass =
    'bg-[#0a0a0f] border border-[#232336] rounded-lg px-2 py-1 text-xs font-mono text-[#c8c8d4] focus:outline-none focus:border-cyan-400/60'

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentRole}
        disabled={busy}
        onChange={(e) => handleRoleChange(e.target.value)}
        className={selectClass}
      >
        <option value="user">user</option>
        <option value="moderator">moderator</option>
        <option value="admin">admin</option>
      </select>

      <button
        onClick={handleBanToggle}
        disabled={busy}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all disabled:opacity-50 ${
          isBanned
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/20'
        }`}
      >
        {isBanned ? 'ปลดแบน' : 'แบน'}
      </button>
    </div>
  )
}