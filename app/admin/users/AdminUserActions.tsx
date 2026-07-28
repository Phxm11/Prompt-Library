'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import SelectMenu from '@/app/components/SelectMenu'
import { showToast } from '@/app/components/Toast'

type AdminUserActionsProps = {
  userId: string
  currentRole: string
  isBanned: boolean
  displayName?: string
}

/*
  เลิกใช้ role moderator แล้ว เหลือแค่ user กับ admin
  แต่ยังมีบัญชีเก่าที่ค่ายังเป็น moderator อยู่ ถ้าไม่ใส่เข้าไปในลิสต์
  ช่องเลือกของคนนั้นจะว่างเปล่าเพราะหาค่าที่ตรงไม่เจอ จึงเติมให้เฉพาะกรณีนั้น
*/
const ROLES = [
  { value: 'user', label: 'user' },
  { value: 'admin', label: 'admin' },
]

export default function AdminUserActions({
  userId,
  currentRole,
  isBanned,
  displayName,
}: AdminUserActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [askBan, setAskBan] = useState(false)

  const who = displayName ? `“${displayName}”` : 'ผู้ใช้รายนี้'

  async function handleRoleChange(newRole: string) {
    if (newRole === currentRole) return

    setBusy(true)
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: newRole,
    })
    setBusy(false)

    if (error) {
      showToast(`เปลี่ยนสิทธิ์ไม่สำเร็จ: ${error.message}`, 'error')
      return
    }

    showToast(`เปลี่ยนสิทธิ์เป็น ${newRole} แล้ว`)
    router.refresh()
  }

  async function handleUnban() {
    setBusy(true)
    const { error } = await supabase.rpc('unban_user', { target_user_id: userId })
    setBusy(false)

    if (error) {
      showToast(`ปลดแบนไม่สำเร็จ: ${error.message}`, 'error')
      return
    }

    showToast('ปลดแบนแล้ว')
    router.refresh()
  }

  async function handleBan(reason: string) {
    setBusy(true)
    const { error } = await supabase.rpc('ban_user', {
      target_user_id: userId,
      reason: reason.trim() || null,
    })
    setBusy(false)

    if (error) {
      showToast(`แบนไม่สำเร็จ: ${error.message}`, 'error')
      return
    }

    setAskBan(false)
    showToast('แบนผู้ใช้แล้ว')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <SelectMenu
        className="w-40"
        ariaLabel="เปลี่ยนสิทธิ์ผู้ใช้"
        value={currentRole}
        onChange={handleRoleChange}
        options={
          ROLES.some((r) => r.value === currentRole)
            ? ROLES
            : [...ROLES, { value: currentRole, label: `${currentRole} (เลิกใช้แล้ว)` }]
        }
      />

      <button
        onClick={() => (isBanned ? handleUnban() : setAskBan(true))}
        disabled={busy}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all disabled:opacity-50 ${
          isBanned
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-accent2/10 text-accent2 border-accent2/30 hover:bg-accent2/20'
        }`}
      >
        {isBanned ? 'ปลดแบน' : 'แบน'}
      </button>

      <ConfirmDialog
        open={askBan}
        busy={busy}
        title={`แบน${displayName ? ` ${who}` : 'ผู้ใช้รายนี้'}?`}
        description="ผู้ใช้จะเข้าใช้งานไม่ได้จนกว่าจะปลดแบน ปลดคืนได้ภายหลัง"
        inputLabel="เหตุผล (ไม่บังคับ)"
        inputPlaceholder="เช่น โพสต์เนื้อหาไม่เหมาะสม"
        confirmLabel="แบนผู้ใช้"
        onConfirm={handleBan}
        onCancel={() => setAskBan(false)}
      />
    </div>
  )
}
