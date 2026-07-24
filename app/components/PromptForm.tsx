'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Option = { id: string; name: string }

type ExistingExample = { example_id: string; file_url: string }

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
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.cover_image_url ?? null
  )

  const [exampleFiles, setExampleFiles] = useState<File[]>([])
  const [examplePreviews, setExamplePreviews] = useState<string[]>([])
  const existingExamples = initialData?.existingExamples ?? []

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function handleExamplesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setExampleFiles((prev) => [...prev, ...files])
    setExamplePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  function removeNewExample(idx: number) {
    setExampleFiles((prev) => prev.filter((_, i) => i !== idx))
    setExamplePreviews((prev) => prev.filter((_, i) => i !== idx))
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

  async function handleSubmit(e: React.FormEvent) {
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
        is_public: isPublic,
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

      // 3. อัปโหลดภาพตัวอย่างเพิ่มเติม (ถ้ามี) แล้วบันทึกลง prompt_examples
      if (exampleFiles.length > 0) {
        const startOrder = existingExamples.length
        for (let i = 0; i < exampleFiles.length; i++) {
          const url = await uploadFile(exampleFiles[i], 'examples')
          await supabase.from('prompt_examples').insert({
            prompt_id: finalPromptId,
            file_url: url,
            sort_order: startOrder + i,
          })
        }
      }

      router.push(`/prompts/${finalPromptId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-[#12121c] border border-[#232336] rounded-lg px-3.5 py-2.5 text-sm text-[#f2f2f7] placeholder:text-[#666680] focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.1)] transition-all'

  const labelClass =
    'text-xs font-mono font-medium text-cyan-400/80 tracking-widest mb-2 block uppercase'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-sm rounded-lg px-4 py-3">
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
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#12121c]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>ประเภทสื่อ</label>
          <select
            value={mediaTypeId}
            onChange={(e) => setMediaTypeId(e.target.value)}
            className={inputClass}
          >
            {mediaTypes.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#12121c]">
                {m.name}
              </option>
            ))}
          </select>
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
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                    : 'bg-transparent text-[#8888a0] border-[#232336] hover:border-cyan-500/50'
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
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 rounded-lg bg-[#12121c] border border-[#232336] overflow-hidden shrink-0 flex items-center justify-center">
            {coverPreview ? (
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-[#666680] font-mono">no image</span>
            )}
          </div>
          <label className="cursor-pointer px-4 py-2.5 rounded-lg text-sm font-mono border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all">
            เลือกไฟล์ภาพ
            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* ภาพตัวอย่างเพิ่มเติม */}
      <div>
        <label className={labelClass}>ภาพตัวอย่างเพิ่มเติม (เลือกได้หลายรูป)</label>

        <div className="flex flex-wrap gap-3 mb-3">
          {existingExamples.map((ex) => (
            <div
              key={ex.example_id}
              className="w-20 h-20 rounded-lg overflow-hidden border border-[#232336]"
            >
              <img src={ex.file_url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}

          {examplePreviews.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-cyan-500/40">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewExample(idx)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <label className="inline-block cursor-pointer px-4 py-2.5 rounded-lg text-sm font-mono border border-[#232336] text-[#8888a0] hover:border-cyan-500/40 hover:text-cyan-300 transition-all">
          + เพิ่มภาพตัวอย่าง
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleExamplesChange}
            className="hidden"
          />
        </label>
      </div>

      {/* เผยแพร่สาธารณะ */}
      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 accent-cyan-500"
        />
        <span className="text-sm text-[#c8c8d4]">เผยแพร่ให้ทุกคนเห็น (Public)</span>
      </label>

      {/* ปุ่ม submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg font-mono text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? 'กำลังบันทึก...'
          : isEditMode
          ? 'บันทึกการแก้ไข'
          : 'เผยแพร่ Prompt'}
      </button>
    </form>
  )
}