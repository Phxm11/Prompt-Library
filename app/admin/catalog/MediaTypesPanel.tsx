'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { inputClass, labelClass, friendlyDbError } from '@/app/admin/catalog/styles'

export type MediaType = {
  media_type_id: string
  name: string
  slug: string
  icon: string | null
}

const EMPTY_FORM = { name: '', slug: '', icon: '' }

export default function MediaTypesPanel({ initialRows }: { initialRows: MediaType[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState(initialRows)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaType | null>(null)

  function startEdit(row: MediaType) {
    setEditingId(row.media_type_id)
    setEditForm({ name: row.name, slug: row.slug, icon: row.icon ?? '' })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return

    setBusy(true)
    const { data, error } = await supabase
      .from('media_types')
      .insert({ name: form.name.trim(), slug: form.slug.trim(), icon: form.icon.trim() || null })
      .select()
      .single()
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) => [...prev, data as MediaType].sort((a, b) => a.name.localeCompare(b.name)))
    setForm(EMPTY_FORM)
    showToast('เพิ่มประเภทสื่อแล้ว')
    router.refresh()
  }

  async function handleSaveEdit(row: MediaType) {
    setBusy(true)
    const { error } = await supabase
      .from('media_types')
      .update({
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        icon: editForm.icon.trim() || null,
      })
      .eq('media_type_id', row.media_type_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) =>
      prev.map((r) =>
        r.media_type_id === row.media_type_id
          ? { ...r, name: editForm.name.trim(), slug: editForm.slug.trim(), icon: editForm.icon.trim() || null }
          : r
      )
    )
    setEditingId(null)
    showToast('บันทึกแล้ว')
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    const { error } = await supabase
      .from('media_types')
      .delete()
      .eq('media_type_id', deleteTarget.media_type_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      setDeleteTarget(null)
      return
    }

    setRows((prev) => prev.filter((r) => r.media_type_id !== deleteTarget.media_type_id))
    setDeleteTarget(null)
    showToast('ลบแล้ว')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-surface border border-line rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-mono font-bold text-ink">เพิ่มประเภทสื่อใหม่</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>ชื่อ</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="เช่น รูปภาพ"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputClass}
              placeholder="เช่น image"
              required
            />
          </div>
          <div>
            <label className={labelClass}>ไอคอน (ไม่บังคับ)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className={inputClass}
              placeholder="ชื่อไอคอนตามที่ตั้งไว้ในระบบ"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-sm font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
        >
          + เพิ่มประเภทสื่อ
        </button>
      </form>

      <div className="space-y-2">
        {rows.map((row) => {
          const isEditing = editingId === row.media_type_id
          return (
            <div key={row.media_type_id} className="bg-surface border border-line rounded-lg px-4 py-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={inputClass}
                      placeholder="ชื่อ"
                    />
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      className={inputClass}
                      placeholder="slug"
                    />
                    <input
                      type="text"
                      value={editForm.icon}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                      className={inputClass}
                      placeholder="ไอคอน"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(row)}
                      disabled={busy}
                      className="rounded-lg border border-accent/60 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/20 disabled:opacity-50"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink font-medium">{row.name}</span>
                    <span className="font-mono text-xs text-faint">/{row.slug}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(row)}
                      className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeleteTarget(row)}
                      className="rounded-lg border border-accent2/30 bg-accent2/10 px-3 py-1.5 font-mono text-xs text-accent2 hover:bg-accent2/20"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {rows.length === 0 && (
          <p className="text-sm text-faint font-mono text-center py-8">ยังไม่มีประเภทสื่อ</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`ลบประเภทสื่อ "${deleteTarget?.name}"?`}
        description="ถ้ามี Prompt หรือ AI Model ที่ใช้ประเภทสื่อนี้อยู่ จะลบไม่สำเร็จ ต้องย้ายข้อมูลเหล่านั้นก่อน"
        confirmLabel="ลบ"
        tone="danger"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
