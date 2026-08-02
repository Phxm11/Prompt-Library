'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { inputClass, labelClass, friendlyDbError } from '@/app/admin/catalog/styles'

export type Category = {
  category_id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number | null
  is_active: boolean | null
}

const EMPTY_FORM = { name: '', slug: '', description: '', icon: '', sort_order: '0' }

export default function CategoriesPanel({ initialRows }: { initialRows: Category[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState(initialRows)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  function startEdit(row: Category) {
    setEditingId(row.category_id)
    setEditForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      icon: row.icon ?? '',
      sort_order: String(row.sort_order ?? 0),
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return

    setBusy(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      })
      .select()
      .single()
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) => [...prev, data as Category].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
    setForm(EMPTY_FORM)
    showToast('เพิ่มหมวดหมู่แล้ว')
    router.refresh()
  }

  async function handleSaveEdit(row: Category) {
    setBusy(true)
    const { error } = await supabase
      .from('categories')
      .update({
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        description: editForm.description.trim() || null,
        icon: editForm.icon.trim() || null,
        sort_order: Number(editForm.sort_order) || 0,
      })
      .eq('category_id', row.category_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) =>
      prev.map((r) =>
        r.category_id === row.category_id
          ? {
              ...r,
              name: editForm.name.trim(),
              slug: editForm.slug.trim(),
              description: editForm.description.trim() || null,
              icon: editForm.icon.trim() || null,
              sort_order: Number(editForm.sort_order) || 0,
            }
          : r
      )
    )
    setEditingId(null)
    showToast('บันทึกแล้ว')
    router.refresh()
  }

  async function handleToggleActive(row: Category) {
    const nextActive = !row.is_active
    const { error } = await supabase
      .from('categories')
      .update({ is_active: nextActive })
      .eq('category_id', row.category_id)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      return
    }

    setRows((prev) =>
      prev.map((r) => (r.category_id === row.category_id ? { ...r, is_active: nextActive } : r))
    )
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('category_id', deleteTarget.category_id)
    setBusy(false)

    if (error) {
      showToast(friendlyDbError(error), 'error')
      setDeleteTarget(null)
      return
    }

    setRows((prev) => prev.filter((r) => r.category_id !== deleteTarget.category_id))
    setDeleteTarget(null)
    showToast('ลบแล้ว')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* ฟอร์มเพิ่มหมวดหมู่ใหม่ */}
      <form onSubmit={handleCreate} className="bg-surface border border-line rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-mono font-bold text-ink">เพิ่มหมวดหมู่ใหม่</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>ชื่อ</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="เช่น การตลาด"
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
              placeholder="เช่น marketing"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <div>
            <label className={labelClass}>คำอธิบาย (ไม่บังคับ)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ลำดับ</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              className={`${inputClass} w-24`}
            />
          </div>
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
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-sm font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
        >
          + เพิ่มหมวดหมู่
        </button>
      </form>

      {/* รายการหมวดหมู่ที่มีอยู่ */}
      <div className="space-y-2">
        {rows.map((row) => {
          const isEditing = editingId === row.category_id
          return (
            <div
              key={row.category_id}
              className="bg-surface border border-line rounded-lg px-4 py-3"
            >
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
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      className={inputClass}
                      placeholder="slug"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className={inputClass}
                      placeholder="คำอธิบาย"
                    />
                    <input
                      type="number"
                      value={editForm.sort_order}
                      onChange={(e) => setEditForm({ ...editForm, sort_order: e.target.value })}
                      className={`${inputClass} w-24`}
                    />
                    <input
                      type="text"
                      value={editForm.icon}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                      className={`${inputClass} w-40`}
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-ink font-medium">{row.name}</span>
                      <span className="font-mono text-xs text-faint">/{row.slug}</span>
                      {row.is_active === false && (
                        <span className="font-mono text-xs text-accent2 bg-accent2/10 border border-accent2/30 rounded px-1.5 py-0.5">
                          ปิดใช้งาน
                        </span>
                      )}
                    </div>
                    {row.description && (
                      <p className="text-xs text-muted mt-1 truncate">{row.description}</p>
                    )}
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
          <p className="text-sm text-faint font-mono text-center py-8">ยังไม่มีหมวดหมู่</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`ลบหมวดหมู่ "${deleteTarget?.name}"?`}
        description="ถ้ามี Prompt ที่ใช้หมวดหมู่นี้อยู่ จะลบไม่สำเร็จ ต้องย้าย Prompt เหล่านั้นไปหมวดหมู่อื่นก่อน"
        confirmLabel="ลบ"
        tone="danger"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
