'use client'

import { useRef } from 'react'
import ImageCropBox, { DEFAULT_CROP } from '@/app/components/ImageCropBox'
import { showToast } from '@/app/components/Toast'
import { MAX_DIMENSION, MAX_SOURCE_BYTES, formatMB, prepareImageUpload } from '@/lib/prepareImageUpload'

export type ExampleItem = {
  /** คีย์ภายในฝั่ง client ใช้เป็น key ของ React เท่านั้น */
  key: string
  /** มีค่าเมื่อเป็นรูปที่บันทึกไว้ในฐานข้อมูลแล้ว */
  existingId?: string
  /** ไฟล์ใหม่ที่รออัปโหลด (รูปที่เพิ่งเพิ่ม หรือรูปที่กดเปลี่ยน) */
  file?: File
  /** URL ที่ใช้แสดงตอนนี้ */
  url: string
  /** URL เดิมก่อนกดเปลี่ยนรูป เก็บไว้ให้กดยกเลิกได้ */
  previousUrl?: string
  position: string
  zoom: number
}

export function newExampleKey() {
  return `ex-${crypto.randomUUID()}`
}

/** จำนวนภาพตัวอย่างสูงสุดต่อหนึ่ง prompt */
export const MAX_EXAMPLES = 10

export default function ExampleImagesEditor({
  items,
  onChange,
}: {
  items: ExampleItem[]
  onChange: (next: ExampleItem[]) => void
}) {
  const addInputRef = useRef<HTMLInputElement>(null)
  const replaceIndexRef = useRef<number | null>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  const isFull = items.length >= MAX_EXAMPLES

  function update(index: number, patch: Partial<ExampleItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (files.length === 0) return

    // เลือกมาเกินโควตา ให้รับเท่าที่เหลือแล้วบอกว่าตัดไปกี่รูป ดีกว่าปฏิเสธทั้งชุด
    const slotsLeft = MAX_EXAMPLES - items.length
    if (slotsLeft <= 0) {
      showToast(`ใส่ภาพตัวอย่างได้สูงสุด ${MAX_EXAMPLES} รูป`, 'error')
      return
    }

    const accepted = files.slice(0, slotsLeft)
    if (files.length > slotsLeft) {
      showToast(
        `เพิ่มได้อีก ${slotsLeft} รูป (สูงสุด ${MAX_EXAMPLES} รูป) — ข้ามไป ${
          files.length - slotsLeft
        } รูป`,
        'error'
      )
    }

    // ย่อทีละไฟล์ ไฟล์ไหนไม่ผ่านเกณฑ์ก็ข้ามไฟล์นั้นไป ไม่ทิ้งทั้งชุด
    const prepared: ExampleItem[] = []
    for (const file of accepted) {
      try {
        const ready = await prepareImageUpload(file)
        prepared.push({
          key: newExampleKey(),
          file: ready,
          url: URL.createObjectURL(ready),
          ...DEFAULT_CROP,
        })
      } catch (err) {
        showToast(
          `${file.name}: ${err instanceof Error ? err.message : 'เตรียมรูปไม่สำเร็จ'}`,
          'error'
        )
      }
    }

    if (prepared.length > 0) onChange([...items, ...prepared])
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const index = replaceIndexRef.current
    e.target.value = ''
    replaceIndexRef.current = null
    if (!file || index === null) return

    try {
      const ready = await prepareImageUpload(file)
      const current = items[index]
      update(index, {
        file: ready,
        url: URL.createObjectURL(ready),
        // เก็บของเดิมไว้ครั้งแรกที่เปลี่ยนเท่านั้น กดเปลี่ยนซ้ำหลายรอบก็ยังยกเลิกกลับไปต้นฉบับได้
        previousUrl: current.previousUrl ?? current.url,
      })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เตรียมรูปไม่สำเร็จ', 'error')
    }
  }

  function cancelReplace(index: number) {
    const current = items[index]
    if (!current.previousUrl) return
    update(index, { url: current.previousUrl, previousUrl: undefined, file: undefined })
  }

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="rounded-xl border border-line bg-surface p-3 flex flex-col sm:flex-row gap-3"
            >
              <div className="w-full sm:w-56 shrink-0">
                <ImageCropBox
                  src={item.url}
                  value={{ position: item.position, zoom: item.zoom }}
                  onChange={(crop) => update(index, crop)}
                  compact
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
                    ลำดับที่ {index + 1}
                  </span>
                  {item.previousUrl && (
                    <span className="font-mono text-[11px] text-accent2">เปลี่ยนรูปใหม่</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
                    title="เลื่อนขึ้น"
                  >
                    ↑ ขึ้น
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
                    title="เลื่อนลง"
                  >
                    ↓ ลง
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      replaceIndexRef.current = index
                      replaceInputRef.current?.click()
                    }}
                    className="rounded-lg border border-accent/40 px-2.5 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/10"
                  >
                    เปลี่ยนรูป
                  </button>

                  {item.previousUrl && (
                    <button
                      type="button"
                      onClick={() => cancelReplace(index)}
                      className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
                    >
                      ยกเลิกการเปลี่ยน
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-lg border border-accent2/30 px-2.5 py-1.5 font-mono text-xs text-accent2 transition-colors hover:bg-accent2/10"
                  >
                    ลบรูป
                  </button>
                </div>

                <p className="mt-auto font-mono text-[11px] text-faint">
                  รูปแรกคือรูปที่ขึ้นก่อนในหน้ารายละเอียด
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mb-2 font-mono text-[11px] text-faint">
        ใส่ได้สูงสุด {MAX_EXAMPLES} รูป (ตอนนี้ {items.length}/{MAX_EXAMPLES}) · ไฟล์ละไม่เกิน{' '}
        {formatMB(MAX_SOURCE_BYTES)} · ระบบย่อให้ด้านยาวสุดไม่เกิน {MAX_DIMENSION}px ให้อัตโนมัติ
      </p>

      {isFull ? (
        <p className="inline-block rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-faint">
          ครบ {MAX_EXAMPLES} รูปแล้ว — ลบรูปเดิมออกก่อนถึงจะเพิ่มได้
        </p>
      ) : (
        <label className="inline-block cursor-pointer px-4 py-2.5 rounded-lg text-sm font-mono border border-line text-muted hover:border-accent/40 hover:text-accent transition-all">
          + เพิ่มภาพตัวอย่าง
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAdd}
            className="hidden"
          />
        </label>
      )}

      {/* input ตัวเดียวใช้ร่วมกันทุกแถว จำ index ที่กดไว้ใน ref */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplace}
        className="hidden"
      />
    </div>
  )
}
