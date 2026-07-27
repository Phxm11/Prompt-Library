'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import Icon from '@/app/components/Icon'
import { clearLocalAvatar, getLocalAvatar, setLocalAvatar } from '@/lib/localAvatar'

/** ยิงเมื่อบันทึกโปรไฟล์สำเร็จ เพื่อให้ Navbar โหลดรูป/ชื่อใหม่ทันทีโดยไม่ต้องรีโหลดหน้า */
export const PROFILE_UPDATED = 'profile-updated'

type ProfileEditorProps = {
  userId: string
  email: string
  hasProfile: boolean
  initialDisplayName: string
  initialAvatarUrl: string | null
}

/**
 * ย่อรูปฝั่ง client ก่อนเก็บ — ครอปเป็นสี่เหลี่ยมจัตุรัสจากกึ่งกลาง แล้วลดเหลือ 200px
 * ไฟล์จากกล้องมือถือมักใหญ่ 3-8MB ถ้าเก็บดิบ ๆ จะหนักเกินไปสำหรับคอลัมน์เดียวในตาราง
 */
const AVATAR_SIZE = 200

/** ความยาวชื่อเล่นสูงสุด นับแบบตัวที่ตามองเห็น */
export const NAME_MAX = 15

/*
  ภาษาไทยมีสระบนล่างและวรรณยุกต์ที่นับเป็นคนละหน่วยในสายอักขระ
  เช่น "น้ำใจ" ยาว 5 หน่วย แต่ตาเห็น 3 ตัว
  ถ้าใช้ maxLength ของ input ตรง ๆ คนพิมพ์ไทยจะโดนตัดเร็วเกินจริง จึงต้องนับเป็น grapheme
*/
function toGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
    return [...segmenter.segment(text)].map((s) => s.segment)
  }
  return [...text]
}

function countGraphemes(text: string): number {
  return toGraphemes(text).length
}

function clampName(text: string): string {
  const parts = toGraphemes(text)
  return parts.length <= NAME_MAX ? text : parts.slice(0, NAME_MAX).join('')
}

function fileToSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพที่เปิดได้'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('เบราว์เซอร์ไม่รองรับการย่อรูป'))
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          AVATAR_SIZE,
          AVATAR_SIZE
        )
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * ยิง PATCH ตรงไปที่ REST endpoint เพื่ออ่าน HTTP status กับ body ที่ตอบกลับมาจริง
 * ใช้เฉพาะตอน supabase-js คืน error เปล่า ๆ ซึ่งแปลว่าตัวมันเองก็ parse ไม่ออก
 */
async function describeRawFailure(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  payload: Record<string, unknown>
): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return 'เซสชันหมดอายุ ลองเข้าสู่ระบบใหม่'

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    const res = await fetch(`${base}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })
    const text = (await res.text()).slice(0, 300)
    console.error(`[profile] raw PATCH -> HTTP ${res.status} | body=${text || '(ว่าง)'}`)
    return `HTTP ${res.status} ${text || '(ไม่มีข้อความตอบกลับ)'}`
  } catch (err) {
    return err instanceof Error ? err.message : 'ติดต่อเซิร์ฟเวอร์ไม่ได้'
  }
}

export default function ProfileEditor({
  userId,
  email,
  hasProfile,
  initialDisplayName,
  initialAvatarUrl,
}: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [localOnly, setLocalOnly] = useState(false)
  const [saving, setSaving] = useState(false)

  /*
    ค่าตั้งต้นที่ใช้เทียบว่ามีอะไรเปลี่ยนไหม และใช้ตอนกดยกเลิก
    ต้องเก็บเป็น state แยก ไม่ใช้ prop ตรง ๆ เพราะรูปอาจมาจากที่เก็บสำรองในเครื่อง
    และหลังบันทึกสำเร็จก็ต้องเลื่อนค่าตั้งต้นตามด้วย ปุ่มบันทึกจะได้กลับไปเป็นปิด
  */
  const [baseName, setBaseName] = useState(initialDisplayName)
  const [baseAvatar, setBaseAvatar] = useState<string | null>(initialAvatarUrl)

  // อ่านรูปสำรองหลัง mount เท่านั้น ถ้าอ่านตอน render แรกจะไม่ตรงกับที่เซิร์ฟเวอร์ส่งมา
  useEffect(() => {
    if (initialAvatarUrl) return
    const local = getLocalAvatar(userId)
    if (local) {
      setAvatarUrl(local)
      setBaseAvatar(local)
      setLocalOnly(true)
    }
  }, [initialAvatarUrl, userId])
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const dirty = displayName !== baseName || avatarUrl !== baseAvatar
  const initials = (displayName || email).trim().charAt(0).toUpperCase()
  const nameCount = countGraphemes(displayName)

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('เลือกได้เฉพาะไฟล์รูปภาพ', 'error')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('ไฟล์ใหญ่เกิน 8MB', 'error')
      return
    }

    try {
      setAvatarUrl(await fileToSquareDataUrl(file))
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เปิดรูปไม่สำเร็จ', 'error')
    }
  }

  async function handleSave() {
    const name = clampName(displayName.trim())
    if (!name) {
      showToast('ตั้งชื่อเล่นก่อนบันทึก', 'error')
      return
    }
    if (countGraphemes(name) > NAME_MAX) {
      showToast(`ชื่อเล่นยาวได้ไม่เกิน ${NAME_MAX} ตัวอักษร`, 'error')
      return
    }

    setSaving(true)
    const payload = { display_name: name, avatar_url: avatarUrl }

    /*
      สำคัญ: ถ้า RLS ไม่อนุญาต Supabase จะไม่คืน error แต่คืน "สำเร็จ 0 แถว"
      จึงต้อง .select() แล้วนับแถวที่เขียนได้จริง ไม่งั้นจะขึ้นว่าบันทึกสำเร็จทั้งที่ไม่มีอะไรเปลี่ยน
    */
    let { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id')

    // ไม่มีแถวให้อัปเดต = ยังไม่เคยมีโปรไฟล์ ลองสร้างใหม่
    if (!error && (data?.length ?? 0) === 0) {
      const inserted = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: email.split('@')[0].slice(0, 20) + Math.floor(Math.random() * 1000),
          ...payload,
        })
        .select('id')
      data = inserted.data
      error = inserted.error
    }

    setSaving(false)

    if (error) {
      /*
        แสดงข้อความดิบเสมอ อย่าสรุปแทน — 22001 ของ Postgres บอกความยาวที่จำกัดไว้มาด้วย
        และถ้า error ไม่มี property เลย (เช่นโดนปฏิเสธที่ชั้น gateway ก่อนถึง PostgREST)
        ต้องยิง request ดิบซ้ำเพื่อดู HTTP status กับ body จริง ไม่งั้นจะได้แค่ {} ซึ่งบอกอะไรไม่ได้
      */
      // overlay ของ Next.js แสดง object ที่ log ไปเป็น {} เสมอ จึงต้องประกอบเป็นสตริงก่อน
      const own = Object.getOwnPropertyNames(error ?? {})
      const detail = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
      const summary = detail || (await describeRawFailure(supabase, userId, payload))

      console.error(
        `[profile] save failed | code=${error.code ?? '-'} | keys=[${own.join(',')}] | ` +
          `raw=${JSON.stringify(error, own)} | ${summary}`
      )

      /*
        22001 = ค่ายาวเกินความยาวคอลัมน์ ซึ่งในทางปฏิบัติมีแต่รูปที่ยาวขนาดนั้นได้
        (data URL ~20,000 ตัวอักษร ส่วน display_name จำกัดไว้ที่ 40 ตัวอยู่แล้ว)
        กรณีนี้ยังบันทึกชื่อเล่นให้ได้ ไม่ต้องให้ผู้ใช้เสียการแก้ชื่อไปด้วยเพราะรูปเดียว
      */
      if (error.code === '22001' && avatarUrl?.startsWith('data:')) {
        const nameOnly = await supabase
          .from('profiles')
          .update({ display_name: name })
          .eq('id', userId)
          .select('id')

        const savedName = !nameOnly.error && (nameOnly.data?.length ?? 0) > 0
        const savedLocally = setLocalAvatar(userId, avatarUrl)
        setLocalOnly(savedLocally)
        if (savedName) setBaseName(name)
        if (savedLocally) setBaseAvatar(avatarUrl)

        showToast(
          savedLocally
            ? `${savedName ? 'บันทึกชื่อเล่นแล้ว ' : ''}ส่วนรูปเก็บไว้ในเครื่องนี้ชั่วคราว เพราะฐานข้อมูลรับไม่ไหว`
            : 'บันทึกไม่สำเร็จ: คอลัมน์ avatar_url เป็น varchar(500) ต้องเปลี่ยนเป็น text',
          'error'
        )

        window.dispatchEvent(new CustomEvent(PROFILE_UPDATED))
        if (savedName) router.refresh()
        return
      }

      showToast(`บันทึกไม่สำเร็จ: ${summary}`, 'error')
      return
    }

    if ((data?.length ?? 0) === 0) {
      showToast('บันทึกไม่สำเร็จ: ฐานข้อมูลปฏิเสธการเขียน (RLS policy)', 'error')
      return
    }

    // เก็บลงฐานข้อมูลได้แล้ว รูปสำรองในเครื่องไม่จำเป็นอีก
    clearLocalAvatar(userId)
    setLocalOnly(false)
    setBaseName(name)
    setBaseAvatar(avatarUrl)
    showToast('บันทึกโปรไฟล์แล้ว')

    // Navbar เป็น client component ที่ดึงโปรไฟล์ครั้งเดียวตอน mount
    // router.refresh() รีเฟรชแค่ server component จึงต้องบอกมันตรง ๆ ให้ไปโหลดใหม่
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED))
    router.refresh()
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
      {/* รูปโปรไฟล์ */}
      <div className="relative shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-accent/40 bg-base shadow-[0_0_24px_-6px_color-mix(in_srgb,var(--accent)_60%,transparent)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="รูปโปรไฟล์" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-3xl font-extrabold text-accent">
              {initials}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="เลือกรูปจากเครื่อง"
          aria-label="เลือกรูปโปรไฟล์จากเครื่อง"
          className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-accent/60 bg-surface text-accent transition-all hover:bg-accent/15 hover:scale-105"
        >
          <Icon name="plus" size={16} />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePick}
          className="hidden"
        />
      </div>

      {/* ชื่อเล่น + ปุ่มบันทึก */}
      <div className="min-w-0 flex-1">
        <label
          htmlFor="display-name"
          className="mb-1.5 flex items-center justify-between gap-2 text-xs font-mono text-muted"
        >
          <span>ชื่อเล่น</span>
          <span className={nameCount >= NAME_MAX ? 'text-accent2' : 'text-faint'}>
            {nameCount}/{NAME_MAX}
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(clampName(e.target.value))}
            placeholder={`ตั้งชื่อที่อยากให้คนอื่นเห็น (ไม่เกิน ${NAME_MAX} ตัว)`}
            className="min-w-0 flex-1 rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
          />

          {avatarUrl && (
            <button
              type="button"
              onClick={() => {
                setAvatarUrl(null)
                clearLocalAvatar(userId)
                setLocalOnly(false)
              }}
              className="rounded-lg border border-line px-3 py-2.5 font-mono text-xs text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
            >
              ลบรูป
            </button>
          )}

          {dirty && !saving && (
            <button
              type="button"
              onClick={() => {
                setDisplayName(baseName)
                setAvatarUrl(baseAvatar)
              }}
              className="rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
            >
              ยกเลิก
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="rounded-lg border border-accent/60 bg-accent/10 px-5 py-2.5 font-mono text-sm text-accent transition-all hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
        <p className="mt-2 text-xs text-faint">{email}</p>

        {localOnly && (
          <p className="mt-2 rounded-lg border border-accent2/40 bg-accent2/5 px-3 py-2 text-xs text-accent2">
            รูปนี้เก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น คนอื่นยังไม่เห็น และจะหายถ้าล้างข้อมูลเบราว์เซอร์
            <br />
            แก้ถาวรได้ด้วยการเปลี่ยนชนิดคอลัมน์ profiles.avatar_url เป็น text
          </p>
        )}
      </div>
    </div>
  )
}
