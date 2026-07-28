'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SelectMenu from '@/app/components/SelectMenu'
import ImageCropBox, { DEFAULT_CROP } from '@/app/components/ImageCropBox'
import ExampleImagesEditor, { type ExampleItem } from '@/app/components/ExampleImagesEditor'
import { showToast } from '@/app/components/Toast'
import { MAX_DIMENSION, MAX_SOURCE_BYTES, formatMB, prepareImageUpload } from '@/lib/prepareImageUpload'

type Option = { id: string; name: string }

type ExistingExample = {
  example_id: string
  file_url: string
  position?: string | null
  zoom?: number | null
}

type PromptFormProps = {
  categories: Option[]
  mediaTypes: Option[]
  aiModels: Option[]
  // ใส่ค่านี้เมื่อเป็นโหมดแก้ไข
  promptId?: string
  initialData?: {
    title: string
    prompt_text: string
    negative_prompt: string | null
    description: string | null
    category_id: string | null
    media_type_id: string | null
    cover_image_url: string | null
    cover_position?: string | null
    cover_zoom?: number | null
    status?: string | null
    is_public: boolean
    selectedAiModelIds: string[]
    existingExamples: ExistingExample[]
  }
}

export default function PromptForm({
  categories,
  mediaTypes,
  aiModels,
  promptId,
  initialData,
}: PromptFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditMode = Boolean(promptId)
  const isDraft = initialData?.status === 'draft'

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [promptText, setPromptText] = useState(initialData?.prompt_text ?? '')
  const [negativePrompt, setNegativePrompt] = useState(initialData?.negative_prompt ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? categories[0]?.id ?? '')
  const [mediaTypeId, setMediaTypeId] = useState(initialData?.media_type_id ?? mediaTypes[0]?.id ?? '')
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true)
  const [selectedModels, setSelectedModels] = useState<string[]>(
    initialData?.selectedAiModelIds ?? []
  )

  const [coverFile, setCoverFile] = useState<File | null>(null)
  // ตำแหน่งที่จะโชว์รูปในกรอบการ์ด เก็บเป็นค่า CSS object-position
  const [coverCrop, setCoverCrop] = useState({
    position: initialData?.cover_position ?? DEFAULT_CROP.position,
    zoom: initialData?.cover_zoom ?? DEFAULT_CROP.zoom,
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.cover_image_url ?? null
  )

  // รวมรูปเดิมกับรูปใหม่ไว้ในลิสต์เดียว ลำดับในลิสต์คือลำดับจริงที่จะบันทึก
  const [examples, setExamples] = useState<ExampleItem[]>(() =>
    (initialData?.existingExamples ?? []).map((ex) => ({
      key: ex.example_id,
      existingId: ex.example_id,
      url: ex.file_url,
      position: ex.position ?? DEFAULT_CROP.position,
      zoom: ex.zoom ?? DEFAULT_CROP.zoom,
    }))
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (!file) return

    try {
      // ย่อตั้งแต่ตอนเลือก ผู้ใช้จะได้เห็นเลยว่าไฟล์ใหญ่เกินไปตั้งแต่ต้น ไม่ใช่ไปพังตอนกดบันทึก
      const prepared = await prepareImageUpload(file)
      setCoverFile(prepared)
      setCoverPreview(URL.createObjectURL(prepared))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เตรียมรูปไม่สำเร็จ', 'error')
    }
  }

  function toggleModel(id: string) {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function uploadFile(file: File, folder: string) {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('prompt-images')
      .upload(path, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('prompt-images').getPublicUrl(path)
    return data.publicUrl
  }

  // intent บอกว่าจะเก็บเป็นฉบับร่างหรือเผยแพร่ ต้องส่งเข้ามาตรง ๆ
  // เพราะปุ่มสองปุ่มอยู่ในฟอร์มเดียวกัน จะอ่านจาก state ไม่ทันตอนกด
  async function handleSubmit(e: React.FormEvent, intent: 'draft' | 'publish' = 'publish') {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !promptText.trim()) {
      setError('กรุณากรอกชื่อและเนื้อหา Prompt')
      return
    }

    setSubmitting(true)
    try {
      // 1. อัปโหลดภาพหลัก (ถ้ามีการเลือกไฟล์ใหม่)
      let coverImageUrl = initialData?.cover_image_url ?? null
      if (coverFile) {
        coverImageUrl = await uploadFile(coverFile, 'covers')
      }

      const payload = {
        title: title.trim(),
        prompt_text: promptText.trim(),
        negative_prompt: negativePrompt.trim() || null,
        description: description.trim() || null,
        category_id: categoryId || null,
        media_type_id: mediaTypeId || null,
        cover_image_url: coverImageUrl,
        cover_position: coverCrop.position,
        cover_zoom: coverCrop.zoom,
        // ฉบับร่างต้องไม่โผล่ในหน้ารวมเด็ดขาด จึงบังคับ is_public = false คู่กับ status เสมอ
        status: intent === 'draft' ? 'draft' : 'published',
        is_public: intent === 'draft' ? false : isPublic,
      }

      let finalPromptId = promptId

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('prompts')
          .update(payload)
          .eq('prompt_id', promptId)
        if (updateError) throw updateError
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('กรุณาเข้าสู่ระบบก่อนเพิ่ม Prompt')
          setSubmitting(false)
          return
        }

        const { data: inserted, error: insertError } = await supabase
          .from('prompts')
          .insert({ ...payload, user_id: user.id })
          .select('prompt_id')
          .single()
        if (insertError) throw insertError
        finalPromptId = inserted.prompt_id
      }

      // 2. อัปเดตความสัมพันธ์กับโมเดล AI (ลบของเดิมแล้วใส่ใหม่ทั้งหมด ง่ายและชัวร์สุด)
      if (isEditMode) {
        await supabase.from('prompt_ai_models').delete().eq('prompt_id', finalPromptId)
      }
      if (selectedModels.length > 0) {
        const rows = selectedModels.map((ai_model_id) => ({
          prompt_id: finalPromptId,
          ai_model_id,
        }))
        const { error: modelsError } = await supabase.from('prompt_ai_models').insert(rows)
        if (modelsError) throw modelsError
      }

      /*
        3. ภาพตัวอย่าง — ลำดับบนหน้าจอคือลำดับจริง (sort_order = index)
           รูปที่ถูกลบออกจากรายการ = รูปเดิมที่ไม่เหลืออยู่แล้ว ต้องลบออกจากฐานข้อมูลด้วย
      */
      const keptIds = new Set(examples.filter((it) => it.existingId).map((it) => it.existingId))
      const removedIds = (initialData?.existingExamples ?? [])
        .map((ex) => ex.example_id)
        .filter((id) => !keptIds.has(id))

      if (removedIds.length > 0) {
        const { error: delError } = await supabase
          .from('prompt_examples')
          .delete()
          .in('example_id', removedIds)
        if (delError) throw delError
      }

      for (let i = 0; i < examples.length; i++) {
        const item = examples[i]
        // อัปโหลดเฉพาะรูปที่เพิ่งเลือกใหม่ รูปเดิมใช้ URL เดิมต่อได้เลย
        const fileUrl = item.file ? await uploadFile(item.file, 'examples') : item.url

        const row = {
          file_url: fileUrl,
          sort_order: i,
          position: item.position,
          zoom: item.zoom,
        }

        const { error: exError } = item.existingId
          ? await supabase.from('prompt_examples').update(row).eq('example_id', item.existingId)
          : await supabase.from('prompt_examples').insert({ ...row, prompt_id: finalPromptId })

        if (exError) throw exError
      }

      // ฉบับร่างให้อยู่หน้าแก้ไขต่อ จะได้เขียนต่อได้เลย ส่วนที่เผยแพร่แล้วพาไปดูหน้าจริง
      showToast(intent === 'draft' ? 'บันทึกฉบับร่างแล้ว' : 'เผยแพร่ Prompt แล้ว')
      router.push(
        intent === 'draft' ? `/prompts/${finalPromptId}/edit` : `/prompts/${finalPromptId}`
      )
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-surface border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

  const labelClass =
    'text-xs font-mono font-medium text-accent/80 tracking-widest mb-2 block uppercase'

  return (
    <form onSubmit={handleSubmit} className="stagger-children space-y-6">
      {error && (
        <div className="bg-accent2/10 border border-accent2/30 text-accent2 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* ชื่อ prompt */}
      <div>
        <label className={labelClass}>ชื่อ Prompt</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น ภาพถ่ายอาหารสไตล์ฟู้ดโฟโต้กราฟี"
          className={inputClass}
          required
        />
      </div>

      {/* หมวดหมู่ + ประเภทสื่อ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>หมวดหมู่</label>
          <SelectMenu
            ariaLabel="หมวดหมู่"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <div>
          <label className={labelClass}>ประเภทสื่อ</label>
          <SelectMenu
            ariaLabel="ประเภทสื่อ"
            value={mediaTypeId}
            onChange={setMediaTypeId}
            options={mediaTypes.map((m) => ({ value: m.id, label: m.name }))}
          />
        </div>
      </div>

      {/* โมเดล AI ที่ใช้ได้ */}
      <div>
        <label className={labelClass}>ใช้ได้กับโมเดล (เลือกได้หลายอัน)</label>
        <div className="flex flex-wrap gap-2">
          {aiModels.map((model) => {
            const active = selectedModels.includes(model.id)
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => toggleModel(model.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-mono border transition-all ${
                  active
                    ? 'bg-accent/10 text-accent border-accent shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                    : 'bg-transparent text-muted border-line hover:border-accent/50'
                }`}
              >
                {model.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* เนื้อหา prompt */}
      <div>
        <label className={labelClass}>Prompt</label>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={5}
          placeholder="พิมพ์เนื้อหา prompt ที่นี่..."
          className={`${inputClass} resize-none font-mono`}
          required
        />
      </div>

      {/* negative prompt */}
      <div>
        <label className={labelClass}>Negative Prompt (ถ้ามี)</label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={3}
          placeholder="สิ่งที่ไม่ต้องการให้ปรากฏในผลลัพธ์..."
          className={`${inputClass} resize-none font-mono`}
        />
      </div>

      {/* คำอธิบาย */}
      <div>
        <label className={labelClass}>คำอธิบายเพิ่มเติม</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="อธิบายวิธีใช้ หรือบริบทเพิ่มเติม..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* ภาพหลัก */}
      <div>
        <label className={labelClass}>ภาพหลัก (Cover Image)</label>
        <p className="mb-2 font-mono text-[11px] text-faint">
          ไฟล์ไม่เกิน {formatMB(MAX_SOURCE_BYTES)} · ระบบย่อให้ด้านยาวสุดไม่เกิน {MAX_DIMENSION}px
          ให้อัตโนมัติ
        </p>

        {coverPreview ? (
          <div className="space-y-3">
            <ImageCropBox src={coverPreview} value={coverCrop} onChange={setCoverCrop} />
            <label className="inline-block cursor-pointer px-4 py-2.5 rounded-lg text-sm font-mono border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent transition-all">
              เปลี่ยนรูป
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="aspect-video w-40 rounded-lg bg-surface border border-line overflow-hidden shrink-0 flex items-center justify-center">
              <span className="text-xs text-faint font-mono">no image</span>
            </div>
            <label className="cursor-pointer px-4 py-2.5 rounded-lg text-sm font-mono border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent transition-all">
              เลือกไฟล์ภาพ
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* ภาพตัวอย่างเพิ่มเติม */}
      <div>
        <label className={labelClass}>ภาพตัวอย่างเพิ่มเติม (เลือกได้หลายรูป)</label>
        <ExampleImagesEditor items={examples} onChange={setExamples} />
      </div>

      {/* เผยแพร่สาธารณะ */}
      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 accent-cyan-500"
        />
        <span className="text-sm text-ink-soft">เผยแพร่ให้ทุกคนเห็น (Public)</span>
      </label>

      {/* ปุ่มบันทึก — ฉบับร่างกับเผยแพร่แยกกันชัดเจน */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={submitting}
          className="flex-1 rounded-lg border border-line py-3 font-mono text-sm font-medium text-muted transition-all hover:border-accent/50 hover:text-accent disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : 'เก็บเป็นฉบับร่าง'}
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg border border-accent/60 bg-accent/10 py-3 font-mono text-sm font-medium text-accent transition-all hover:bg-accent/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'กำลังบันทึก...'
            : isDraft
            ? 'เผยแพร่เลย'
            : isEditMode
            ? 'บันทึกการแก้ไข'
            : 'เผยแพร่ Prompt'}
        </button>
      </div>

      {isDraft && (
        <p className="text-center font-mono text-xs text-faint">
          ตอนนี้เป็นฉบับร่าง ยังไม่มีใครเห็นนอกจากคุณ
        </p>
      )}
    </form>
  )
}