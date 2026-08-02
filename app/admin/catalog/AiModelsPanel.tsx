'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import SelectMenu from '@/app/components/SelectMenu'
import { inputClass, labelClass, friendlyDbError } from '@/app/admin/catalog/styles'

export type AiModel = {
  ai_model_id: string
  name: string
  provider: string | null
  media_type_id: string | null
  website_url: string | null
  is_active: boolean | null
}

type MediaTypeOption = { media_type_id: string; name: string }

const EMPTY_FORM = { name: '', provider: '', media_type_id: '', website_url: '' }

export default function AiModelsPanel({
  initialRows,
  mediaTypes,
}: {
  initialRows: AiModel[]
  mediaTypes: MediaTypeOption[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState(initialRows)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AiModel | null>(null)

  const mediaTypeOptions = mediaTypes.map((m) => ({ value: m.media_type_id, label: m.name }))
  const mediaTypeName = (id: string | null) =>
    mediaTypes.find((m) => m.media_type_id === id)?.name ?? '—'

  function startEdit(row: AiModel) {
    setEditingId(row.ai_model_id)
    setEditForm({
      name: row.name,
      provider: row.provider ?? '',
      media_type_id: row.media_type_id ?? '',
      website_url: row.website_url ?? '',
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setBusy(true)
    const { data, error } = await supabase
      .from('ai_models')
      .insert({
        name: form.name.trim(),
        provider: form.provider.trim() || null,
        media_type_id: form.media_type_id || null,
        website_url: form.website_url.trim() || null,
      })
      .select()
      .single()
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) => [...prev, data as AiModel].sort((a, b) => a.name.localeCompare(b.name)))
    setForm(EMPTY_FORM)
    showToast('เพิ่ม AI Model แล้ว')
    router.refresh()
  }

  async function handleSaveEdit(row: AiModel) {
    setBusy(true)
    const { error } = await supabase
      .from('ai_models')
      .update({
        name: editForm.name.trim(),
        provider: editForm.provider.trim() || null,
        media_type_id: editForm.media_type_id || null,
        website_url: editForm.website_url.trim() || null,
      })
      .eq('ai_model_id', row.ai_model_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) =>
      prev.map((r) =>
        r.ai_model_id === row.ai_model_id
          ? {
              ...r,
              name: editForm.name.trim(),
              provider: editForm.provider.trim() || null,
              media_type_id: editForm.media_type_id || null,
              website_url: editForm.website_url.trim() || null,
            }
          : r
      )
    )
    setEditingId(null)
    showToast('บันทึกแล้ว')
    router.refresh()
  }

  async function handleToggleActive(row: AiModel) {
    const nextActive = !row.is_active
    const { error } = await supabase
      .from('ai_models')
      .update({ is_active: nextActive })
      .eq('ai_model_id', row.ai_model_id)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) =>
      prev.map((r) => (r.ai_model_id === row.ai_model_id ? { ...r, is_active: nextActive } : r))
    )
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    const { error } = await supabase.from('ai_models').delete().eq('ai_model_id', deleteTarget.ai_model_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      setDeleteTarget(null)
      return
    }

    setRows((prev) => prev.filter((r) => r.ai_model_id !== deleteTarget.ai_model_id))
    setDeleteTarget(null)
    showToast('ลบแล้ว')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-surface border border-line rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-mono font-bold text-ink">เพิ่ม AI Model ใหม่</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>ชื่อ</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="เช่น Midjourney v6"
              required
            />
          </div>
          <div>
            <label className={labelClass}>ผู้พัฒนา (ไม่บังคับ)</label>
            <input
              type="text"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className={inputClass}
              placeholder="เช่น Midjourney Inc."
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>ประเภทสื่อ</label>
            <SelectMenu
              value={form.media_type_id}
              onChange={(v) => setForm({ ...form, media_type_id: v })}
              options={mediaTypeOptions}
              placeholder="เลือกประเภทสื่อ"
              ariaLabel="ประเภทสื่อ"
            />
          </div>
          <div>
            <label className={labelClass}>เว็บไซต์ (ไม่บังคับ)</label>
            <input
              type="text"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-sm font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
        >
          + เพิ่ม AI Model
        </button>
      </form>

      <div className="space-y-2">
        {rows.map((row) => {
          const isEditing = editingId === row.ai_model_id
          return (
            <div key={row.ai_model_id} className="bg-surface border border-line rounded-lg px-4 py-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className={inputClass}
                      placeholder="ชื่อ"
                    />
                    <input
                      type="text"
                      value={editForm.provider}
                      onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                      className={inputClass}
                      placeholder="ผู้พัฒนา"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SelectMenu
                      value={editForm.media_type_id}
                      onChange={(v) => setEditForm({ ...editForm, media_type_id: v })}
                      options={mediaTypeOptions}
                      placeholder="เลือกประเภทสื่อ"
                      ariaLabel="ประเภทสื่อ"
                    />
                    <input
                      type="text"
                      value={editForm.website_url}
                      onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                      className={inputClass}
                      placeholder="เว็บไซต์"
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-ink font-medium">{row.name}</span>
                      {row.provider && <span className="font-mono text-xs text-faint">{row.provider}</span>}
                      <span className="font-mono text-xs text-muted bg-line/40 rounded px-1.5 py-0.5">
                        {mediaTypeName(row.media_type_id)}
                      </span>
                      {row.is_active === false && (
                        <span className="font-mono text-xs text-accent2 bg-accent2/10 border border-accent2/30 rounded px-1.5 py-0.5">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(row)}
                      className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted hover:text-ink whitespace-nowrap"
                    >
                      {row.is_active === false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </button>
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
          <p className="text-sm text-faint font-mono text-center py-8">ยังไม่มี AI Model</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`ลบ AI Model "${deleteTarget?.name}"?`}
        description="Prompt ที่เคยผูกกับโมเดลนี้จะถูกเอาโมเดลนี้ออกโดยอัตโนมัติ (ตัว Prompt เองไม่ถูกลบ)"
        confirmLabel="ลบ"
        tone="danger"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
