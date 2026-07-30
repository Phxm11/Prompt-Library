'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { showToast } from '@/app/components/Toast'

export type Draft = {
  prompt_id: string
  title: string | null
  cover_image_url: string | null
  cover_position: string | null
  updated_at: string | null
  created_at: string
}

export default function DraftList({ drafts }: { drafts: Draft[] }) {
  const supabase = createClient()
  const [items, setItems] = useState(drafts)
  const [askDelete, setAskDelete] = useState<Draft | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(draft: Draft) {
    setDeleting(true)
    const { data, error } = await supabase
      .from('prompts')
      .delete()
      .eq('prompt_id', draft.prompt_id)
      .select('prompt_id')
    setDeleting(false)

    if (error) {
      showToast(`ลบไม่สำเร็จ: ${error.message}`, 'error')
      return
    }
    // RLS ที่ปฏิเสธจะคืน 0 แถวโดยไม่มี error จึงต้องนับแถวเองเสมอ
    if (!data || data.length === 0) {
      showToast('ลบไม่สำเร็จ: ไม่มีสิทธิ์ลบฉบับร่างนี้', 'error')
      return
    }

    setItems((prev) => prev.filter((d) => d.prompt_id !== draft.prompt_id))
    setAskDelete(null)
    showToast('ลบฉบับร่างแล้ว')
  }

  // ลบจนหมดแล้วก็ไม่ต้องเหลือกล่องเปล่าค้างไว้
  if (items.length === 0) return null

  return (
    <section className="animate-spring-up [animation-delay:60ms] mb-8 rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold text-ink">ฉบับร่างที่ค้างไว้</h2>
        <span className="font-mono text-sm text-accent">({items.length})</span>
      </div>
      <p className="mb-3 font-mono text-xs text-faint">
        กดเพื่อเขียนต่อจากของเดิม หรือข้ามไปกรอกฟอร์มด้านล่างเพื่อเริ่มใหม่
      </p>

      <div className="space-y-2">
        {items.map((draft) => (
          <div
            key={draft.prompt_id}
            className="flex items-center gap-3 rounded-lg border border-line bg-base p-2.5 transition-colors hover:border-accent/60"
          >
            {/* ปุ่มลบต้องอยู่นอกลิงก์ ไม่งั้นกดลบแล้วจะเด้งไปหน้าแก้ไขด้วย */}
            <Link
              href={`/prompts/${draft.prompt_id}/edit`}
              className="group flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
                {draft.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.cover_image_url}
                    alt=""
                    style={{ objectPosition: draft.cover_position ?? '50% 50%' }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center font-mono text-[10px] text-faint">
                    no img
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink group-hover:text-accent">
                  {draft.title?.trim() || '(ยังไม่ได้ตั้งชื่อ)'}
                </p>
                <p className="font-mono text-[11px] text-faint">
                  แก้ล่าสุด{' '}
                  {new Date(draft.updated_at ?? draft.created_at).toLocaleDateString('th-TH', {
                    dateStyle: 'medium',
                  })}
                </p>
              </div>

              <span className="shrink-0 font-mono text-xs text-accent">เขียนต่อ →</span>
            </Link>

            <button
              type="button"
              onClick={() => setAskDelete(draft)}
              aria-label="ลบฉบับร่าง"
              className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={askDelete !== null}
        busy={deleting}
        title="ลบฉบับร่างนี้?"
        description={
          askDelete?.title?.trim()
            ? `"${askDelete.title}" จะถูกลบถาวร กู้คืนไม่ได้`
            : 'ฉบับร่างจะถูกลบถาวร กู้คืนไม่ได้'
        }
        confirmLabel="ลบถาวร"
        onConfirm={() => askDelete && handleDelete(askDelete)}
        onCancel={() => setAskDelete(null)}
      />
    </section>
  )
}
