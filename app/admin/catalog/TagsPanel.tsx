'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { inputClass, friendlyDbError } from '@/app/admin/catalog/styles'

export type Tag = { tag_id: string; name: string }

export default function TagsPanel({ initialRows }: { initialRows: Tag[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState(initialRows)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setBusy(true)
    const { data, error } = await supabase.from('tags').insert({ name: name.trim() }).select().single()
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) => [...prev, data as Tag].sort((a, b) => a.name.localeCompare(b.name)))
    setName('')
    showToast('เพิ่มแท็กแล้ว')
    router.refresh()
  }

  async function handleSaveEdit(row: Tag) {
    setBusy(true)
    const { error } = await supabase.from('tags').update({ name: editName.trim() }).eq('tag_id', row.tag_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) => prev.map((r) => (r.tag_id === row.tag_id ? { ...r, name: editName.trim() } : r)))
    setEditingId(null)
    showToast('บันทึกแล้ว')
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    const { error } = await supabase.from('tags').delete().eq('tag_id', deleteTarget.tag_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      setDeleteTarget(null)
      return
    }

    setRows((prev) => prev.filter((r) => r.tag_id !== deleteTarget.tag_id))
    setDeleteTarget(null)
    showToast('ลบแล้ว')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-surface border border-line rounded-xl p-5 flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="ชื่อแท็กใหม่"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-sm font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
        >
          + เพิ่มแท็ก
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {rows.map((row) => {
          const isEditing = editingId === row.tag_id
          return isEditing ? (
            <div key={row.tag_id} className="flex items-center gap-1.5 bg-surface border border-accent/60 rounded-full pl-3 pr-1.5 py-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-transparent text-sm text-ink font-mono focus:outline-none w-28"
                autoFocus
              />
              <button
                onClick={() => handleSaveEdit(row)}
                disabled={busy}
                className="text-xs font-mono text-accent px-1.5 py-0.5 rounded-full hover:bg-accent/10 disabled:opacity-50"
              >
                ✓
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-xs font-mono text-faint px-1.5 py-0.5 rounded-full hover:bg-line/40"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              key={row.tag_id}
              className="group flex items-center gap-1.5 bg-surface border border-line rounded-full pl-3 pr-1.5 py-1"
            >
              <button
                onClick={() => {
                  setEditingId(row.tag_id)
                  setEditName(row.name)
                }}
                className="text-sm font-mono text-ink"
              >
                {row.name}
              </button>
              <button
                onClick={() => setDeleteTarget(row)}
                className="text-xs font-mono text-faint px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-accent2/10 hover:text-accent2 transition-all"
              >
                ✕
              </button>
            </div>
          )
        })}

        {rows.length === 0 && (
          <p className="text-sm text-faint font-mono text-center py-8 w-full">ยังไม่มีแท็ก</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`ลบแท็ก "${deleteTarget?.name}"?`}
        description="Prompt ที่เคยผูกแท็กนี้จะถูกเอาแท็กนี้ออกโดยอัตโนมัติ (ตัว Prompt เองไม่ถูกลบ)"
        confirmLabel="ลบ"
        tone="danger"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
