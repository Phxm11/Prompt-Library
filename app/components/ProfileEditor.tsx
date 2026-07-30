'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/components/Toast'
import Icon from '@/app/components/Icon'
import ImageCropBox, { DEFAULT_CROP, type CropValue } from '@/app/components/ImageCropBox'
import ConfirmDialog from '@/app/components/ConfirmDialog'
import { clearLocalAvatar, getLocalAvatar, setLocalAvatar } from '@/lib/localAvatar'
import { checkProfanity } from '@/lib/profanity'

/** ยิงเมื่อบันทึกโปรไฟล์สำเร็จ เพื่อให้ Navbar โหลดรูป/ชื่อใหม่ทันทีโดยไม่ต้องรีโหลดหน้า */
export const PROFILE_UPDATED = 'profile-updated'

type ProfileEditorProps = {
  userId: string
  email: string
  username: string
  usernameChangedAt: string | null
  initialDisplayName: string
  initialAvatarUrl: string | null
  initialBio: string
}

/**
 * ย่อรูปฝั่ง client ก่อนเก็บ — ครอปเป็นสี่เหลี่ยมจัตุรัสจากกึ่งกลาง แล้วลดเหลือ 200px
 * ไฟล์จากกล้องมือถือมักใหญ่ 3-8MB ถ้าเก็บดิบ ๆ จะหนักเกินไปสำหรับคอลัมน์เดียวในตาราง
 */
const AVATAR_SIZE = 200

/** ความยาวชื่อเล่นสูงสุด นับแบบตัวที่ตามองเห็น */
export const NAME_MAX = 15

/** ความยาวไบโอสูงสุด นับแบบเดียวกับชื่อเล่น */
export const BIO_MAX = 50

/** ชื่อผู้ใช้เป็น ASCII ล้วนเพราะเอาไปทำ URL จึงนับตัวอักษรตรง ๆ ได้ ไม่ต้องนับ grapheme */
export const USERNAME_MAX = 15
const USERNAME_MIN = 3
const USERNAME_PATTERN = /^[a-z0-9._-]+$/
/** ต้องตรงกับ trigger enforce_username_change_rules ในฐานข้อมูล */
const USERNAME_COOLDOWN_DAYS = 14

/** คืนข้อความบอกที่ผิด หรือ null ถ้าใช้ได้ */
function validateUsername(value: string): string | null {
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `ชื่อผู้ใช้ต้องยาว ${USERNAME_MIN}-${USERNAME_MAX} ตัวอักษร`
  }
  if (!USERNAME_PATTERN.test(value)) {
    return 'ใช้ได้เฉพาะ a-z 0-9 จุด ขีดล่าง และขีดกลาง'
  }
  return null
}

/** วันที่เปลี่ยนชื่อผู้ใช้ได้อีกครั้ง คืน null ถ้าเปลี่ยนได้เลย */
function nextUsernameChangeAt(changedAt: string | null): Date | null {
  if (!changedAt) return null
  const next = new Date(new Date(changedAt).getTime() + USERNAME_COOLDOWN_DAYS * 86_400_000)
  return next > new Date() ? next : null
}

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

function clampTo(text: string, max: number): string {
  const parts = toGraphemes(text)
  return parts.length <= max ? text : parts.slice(0, max).join('')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพที่เปิดได้'))
    img.onload = () => resolve(img)
    img.src = src
  })
}

/**
 * อบกรอบที่ผู้ใช้เลือกลงไปในรูปจริง แล้วย่อเหลือ AVATAR_SIZE
 *
 * ต่างจากรูปปกของ prompt ที่เก็บ position/zoom ไว้แล้วค่อยไปวาดตอนแสดงผล
 * เพราะรูปโปรไฟล์ถูกเอาไปโชว์หลายที่มาก (navbar, การ์ดผู้เขียน, รีวิว)
 * ถ้าเก็บเป็นค่าการแสดงผล ทุกที่ต้องรู้จักค่านั้นหมด ครบบ้างไม่ครบบ้าง
 * อบลงไปในรูปเลยจบที่เดียว ที่เหลือแค่ object-cover ธรรมดาก็ตรงกันทุกที่
 *
 * สูตรต้องตรงกับที่ ImageCropBox แสดง คือ object-cover + object-position แล้วค่อย scale จากจุดกึ่งกลาง
 */
async function bakeCrop(sourceUrl: string, crop: CropValue): Promise<string> {
  const img = await loadImage(sourceUrl)
  const [px, py] = crop.position.split(/\s+/).map((v) => Number.parseFloat(v) || 0)
  const zoom = crop.zoom > 0 ? crop.zoom : 1

  // กรอบตัวอย่างเป็นสี่เหลี่ยมจัตุรัส ใช้ด้านยาว 1 หน่วยแล้วคิดทุกอย่างเป็นสัดส่วนของมัน
  const frame = 1
  const coverScale = Math.max(frame / img.width, frame / img.height) * zoom
  const drawnW = img.width * coverScale

  // ตำแหน่งซ้าย/บนของรูปหลัง object-position แล้วขยายจากกึ่งกลางกรอบ
  const left0 = (frame - img.width * (coverScale / zoom)) * (px / 100)
  const top0 = (frame - img.height * (coverScale / zoom)) * (py / 100)
  const left = frame / 2 + (left0 - frame / 2) * zoom
  const top = frame / 2 + (top0 - frame / 2) * zoom

  // ย้อนกลับไปว่ากรอบ [0,1] ตรงกับพิกเซลช่วงไหนของรูปต้นฉบับ
  const scale = drawnW / img.width
  const sx = -left / scale
  const sy = -top / scale
  const side = frame / scale

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับการย่อรูป')
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  return canvas.toDataURL('image/jpeg', 0.82)
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
  username: initialUsername,
  usernameChangedAt,
  initialDisplayName,
  initialAvatarUrl,
  initialBio,
}: ProfileEditorProps) {
  const [username, setUsername] = useState(initialUsername)
  const [baseUsername, setBaseUsername] = useState(initialUsername)
  const [changedAt, setChangedAt] = useState(usernameChangedAt)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [bio, setBio] = useState(initialBio)
  const [localOnly, setLocalOnly] = useState(false)
  const [saving, setSaving] = useState(false)

  /*
    รูปต้นฉบับที่เพิ่งเลือกมา อยู่ในหน่วยความจำระหว่างหน้านี้เท่านั้น ไม่ได้ส่งขึ้นฐานข้อมูล
    cropSource = กำลังเลือกกรอบอยู่, lastSource = เก็บต้นฉบับไว้ให้กลับมาปรับกรอบใหม่ได้
    ถ้าไม่เก็บไว้ การปรับกรอบรอบสองจะไปครอปทับรูปที่ครอปแล้ว ยิ่งทำยิ่งแตก
  */
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [lastSource, setLastSource] = useState<string | null>(null)
  const [crop, setCrop] = useState<CropValue>(DEFAULT_CROP)
  const [cropping, setCropping] = useState(false)

  /*
    ค่าตั้งต้นที่ใช้เทียบว่ามีอะไรเปลี่ยนไหม และใช้ตอนกดยกเลิก
    ต้องเก็บเป็น state แยก ไม่ใช้ prop ตรง ๆ เพราะรูปอาจมาจากที่เก็บสำรองในเครื่อง
    และหลังบันทึกสำเร็จก็ต้องเลื่อนค่าตั้งต้นตามด้วย ปุ่มบันทึกจะได้กลับไปเป็นปิด
  */
  const [baseName, setBaseName] = useState(initialDisplayName)
  const [baseAvatar, setBaseAvatar] = useState<string | null>(initialAvatarUrl)
  const [baseBio, setBaseBio] = useState(initialBio)

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

  const usernameChanged = username !== baseUsername
  const dirty =
    displayName !== baseName || avatarUrl !== baseAvatar || bio !== baseBio || usernameChanged
  const initials = (displayName || email).trim().charAt(0).toUpperCase()
  const nameCount = countGraphemes(displayName)
  const bioCount = countGraphemes(bio)

  // ล็อกช่องชื่อผู้ใช้ระหว่างที่ยังไม่ครบ 14 วัน กติกาจริงบังคับที่ trigger ฝั่งฐานข้อมูลอีกชั้น
  const lockedUntil = nextUsernameChangeAt(changedAt)
  const usernameError = usernameChanged ? validateUsername(username) : null

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
      // เปิดโหมดเลือกกรอบก่อน ยังไม่แตะ avatarUrl จนกว่าจะกดใช้รูป
      setCropSource(await readFileAsDataUrl(file))
      setCrop(DEFAULT_CROP)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'เปิดรูปไม่สำเร็จ', 'error')
    }
  }

  async function handleApplyCrop() {
    if (!cropSource) return
    setCropping(true)
    try {
      setAvatarUrl(await bakeCrop(cropSource, crop))
      setLastSource(cropSource)
      setCropSource(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ครอปรูปไม่สำเร็จ', 'error')
    } finally {
      setCropping(false)
    }
  }

  /** ด่านแรกตอนกดบันทึก — ถ้าแตะชื่อผู้ใช้ต้องผ่าน pop-up ยืนยันก่อน เพราะเปลี่ยนแล้วรออีก 14 วัน */
  function handleSaveClick() {
    // กันคำไม่สุภาพตั้งแต่ก่อนยิง ผู้ใช้จะได้รู้ทันทีว่าติดช่องไหน
    // (ด่านจริงอยู่ที่ trigger ฝั่งฐานข้อมูล ตรงนี้แค่บอกให้เร็วขึ้น)
    const dirtyWord =
      checkProfanity(displayName, { label: 'ชื่อเล่น', checkReserved: true }) ??
      checkProfanity(username, { label: 'ชื่อผู้ใช้', checkReserved: true }) ??
      checkProfanity(bio, { label: 'ไบโอ' })
    if (dirtyWord) {
      showToast(dirtyWord, 'error')
      return
    }

    if (usernameChanged) {
      const problem = validateUsername(username)
      if (problem) {
        showToast(problem, 'error')
        return
      }
      setConfirmOpen(true)
      return
    }
    handleSave()
  }

  async function handleSave() {
    setConfirmOpen(false)

    const name = clampTo(displayName.trim(), NAME_MAX)
    if (!name) {
      showToast('ตั้งชื่อเล่นก่อนบันทึก', 'error')
      return
    }
    if (countGraphemes(name) > NAME_MAX) {
      showToast(`ชื่อเล่นยาวได้ไม่เกิน ${NAME_MAX} ตัวอักษร`, 'error')
      return
    }

    // ไบโอว่างเก็บเป็น null ไม่ใช่สตริงว่าง จะได้แยกออกว่า "ยังไม่ได้ตั้ง" กับ "ตั้งเป็นค่าว่าง"
    const nextBio = clampTo(bio.trim(), BIO_MAX)

    setSaving(true)
    const payload = {
      display_name: name,
      avatar_url: avatarUrl,
      bio: nextBio || null,
      // ส่งชื่อผู้ใช้ไปเฉพาะตอนเปลี่ยนจริง ไม่งั้น trigger จะไม่มองว่าเปลี่ยนก็จริง แต่เปลืองเปล่า ๆ
      ...(usernameChanged ? { username } : {}),
    }

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

      // 23505 = ชนคีย์ unique ซึ่งในหน้านี้มีแต่ username เท่านั้นที่ unique
      if (error.code === '23505') {
        showToast(`ชื่อผู้ใช้ @${username} มีคนใช้แล้ว ลองชื่ออื่น`, 'error')
        return
      }

      // 23514 = check_violation ที่ trigger ของ username โยนมา ข้อความจาก DB อ่านรู้เรื่องอยู่แล้ว
      if (error.code === '23514') {
        showToast(error.message, 'error')
        return
      }

      /*
        22001 = ค่ายาวเกินความยาวคอลัมน์ ซึ่งในทางปฏิบัติมีแต่รูปที่ยาวขนาดนั้นได้
        (data URL ~20,000 ตัวอักษร ส่วน display_name จำกัดไว้ที่ 40 ตัวอยู่แล้ว)
        กรณีนี้ยังบันทึกชื่อเล่นให้ได้ ไม่ต้องให้ผู้ใช้เสียการแก้ชื่อไปด้วยเพราะรูปเดียว
      */
      if (error.code === '22001' && avatarUrl?.startsWith('data:')) {
        const nameOnly = await supabase
          .from('profiles')
          .update({ display_name: name, bio: nextBio || null })
          .eq('id', userId)
          .select('id')

        const savedName = !nameOnly.error && (nameOnly.data?.length ?? 0) > 0
        const savedLocally = setLocalAvatar(userId, avatarUrl)
        setLocalOnly(savedLocally)
        if (savedName) {
          setBaseName(name)
          setBaseBio(nextBio)
          setBio(nextBio)
        }
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
    setBaseBio(nextBio)
    setBio(nextBio)
    if (usernameChanged) {
      setBaseUsername(username)
      // เริ่มนับ 14 วันจากตอนนี้ ให้ช่องล็อกทันทีโดยไม่ต้องรอโหลดหน้าใหม่
      setChangedAt(new Date().toISOString())
    }
    showToast(usernameChanged ? `เปลี่ยนชื่อผู้ใช้เป็น @${username} แล้ว` : 'บันทึกโปรไฟล์แล้ว')

    // Navbar เป็น client component ที่ดึงโปรไฟล์ครั้งเดียวตอน mount
    // router.refresh() รีเฟรชแค่ server component จึงต้องบอกมันตรง ๆ ให้ไปโหลดใหม่
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED))
    router.refresh()
  }

  // เลือกกรอบรูปอยู่ — ยึดพื้นที่ทั้งการ์ดไปเลย จะได้เห็นรูปใหญ่พอที่จะเล็งกรอบได้จริง
  if (cropSource) {
    return (
      <div className="mx-auto max-w-sm">
        <p className="mb-1 text-center font-display text-lg font-extrabold text-ink">จัดกรอบรูปโปรไฟล์</p>
        <p className="mb-4 text-center font-mono text-xs text-faint">
          ลากเพื่อขยับ · เลื่อนลูกกลิ้งหรือสไลเดอร์เพื่อซูม
        </p>

        <ImageCropBox
          src={cropSource}
          value={crop}
          onChange={setCrop}
          aspect="aspect-square"
          round
        />

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={cropping}
            className="rounded-lg border border-accent/60 bg-accent/10 px-5 py-2.5 font-mono text-sm text-accent transition-all hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cropping ? 'กำลังตัดรูป...' : 'ใช้รูปนี้'}
          </button>
          <button
            type="button"
            onClick={() => setCropSource(null)}
            className="rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            เลือกรูปอื่น
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start">
      {/* รูปโปรไฟล์ — กดที่รูปได้เลย ไม่ต้องเล็งปุ่มเล็ก ๆ */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="เปลี่ยนรูปโปรไฟล์"
          aria-label="เปลี่ยนรูปโปรไฟล์"
          className="group relative block h-36 w-36 rounded-full sm:h-40 sm:w-40"
        >
          {/* วงแหวนไล่สีรอบรูป เว้นช่องว่างด้วย p-[3px] ให้เห็นเป็นเส้นขอบ */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent via-accent/40 to-accent2 p-[3px] shadow-[0_0_36px_-8px_color-mix(in_srgb,var(--accent)_75%,transparent)] transition-shadow group-hover:shadow-[0_0_46px_-6px_color-mix(in_srgb,var(--accent)_85%,transparent)]">
            <span className="block h-full w-full overflow-hidden rounded-full bg-base">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="รูปโปรไฟล์"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              ) : (
                <span className="grid h-full w-full place-items-center font-display text-5xl font-extrabold text-accent">
                  {initials}
                </span>
              )}
            </span>
          </span>

          {/* ป้ายบอกวิธีเปลี่ยนรูป โผล่ตอนชี้เมาส์ */}
          <span className="pointer-events-none absolute inset-[3px] grid place-items-center rounded-full bg-base/70 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <span className="flex flex-col items-center gap-1 font-mono text-xs text-accent">
              <Icon name="plus" size={20} />
              เปลี่ยนรูป
            </span>
          </span>
        </button>

        {avatarUrl && (
          <div className="mt-3 space-y-2">
            {/* ปรับกรอบได้เฉพาะรูปที่เพิ่งเลือกในหน้านี้ เพราะต้องมีต้นฉบับให้ครอปใหม่ */}
            {lastSource && (
              <button
                type="button"
                onClick={() => setCropSource(lastSource)}
                className="block w-full rounded-lg border border-line py-1.5 text-center font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                ปรับกรอบ
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setAvatarUrl(null)
                setLastSource(null)
                clearLocalAvatar(userId)
                setLocalOnly(false)
              }}
              className="block w-full rounded-lg border border-line py-1.5 text-center font-mono text-xs text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
            >
              ลบรูป
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />
      </div>

      {/* ชื่อเล่น + ไบโอ + ปุ่มบันทึก */}
      <div className="w-full min-w-0 flex-1">
        <div className="mb-5 text-center sm:text-left">
          <p className="font-display text-2xl font-extrabold text-ink">
            {displayName.trim() || 'ยังไม่ได้ตั้งชื่อเล่น'}
          </p>
          <p className="mt-1 font-mono text-sm text-accent">@{username}</p>
          {bio.trim() && (
            <p className="mt-2 text-sm text-ink-soft break-words">{bio.trim()}</p>
          )}
          <p className="mt-2 font-mono text-xs text-faint">{email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="mb-1.5 flex items-center justify-between gap-2 text-xs font-mono text-muted"
            >
              <span>ชื่อเล่น</span>
              <span className={nameCount >= NAME_MAX ? 'text-accent2' : 'text-faint'}>
                {nameCount}/{NAME_MAX}
              </span>
            </label>
            <input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(clampTo(e.target.value, NAME_MAX))}
              placeholder={`ตั้งชื่อที่อยากให้คนอื่นเห็น (ไม่เกิน ${NAME_MAX} ตัว)`}
              className="w-full rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1.5 flex items-center justify-between gap-2 text-xs font-mono text-muted"
            >
              <span>ชื่อผู้ใช้ (ลิงก์โปรไฟล์)</span>
              <span className={username.length >= USERNAME_MAX ? 'text-accent2' : 'text-faint'}>
                {username.length}/{USERNAME_MAX}
              </span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">
                @
              </span>
              <input
                id="username"
                value={username}
                // ตัดให้เหลือแต่ตัวที่ใช้ได้ตั้งแต่ตอนพิมพ์ จะได้ไม่ต้องรอโดนปฏิเสธตอนกดบันทึก
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, USERNAME_MAX)
                  )
                }
                disabled={Boolean(lockedUntil)}
                className="w-full rounded-lg border border-line bg-base py-2.5 pl-7 pr-3.5 font-mono text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {lockedUntil ? (
              <p className="mt-1.5 font-mono text-[11px] text-faint">
                เปลี่ยนชื่อผู้ใช้ได้ทุก {USERNAME_COOLDOWN_DAYS} วัน · เปลี่ยนได้อีกครั้ง{' '}
                {lockedUntil.toLocaleDateString('th-TH', { dateStyle: 'medium' })}
              </p>
            ) : usernameError ? (
              <p className="mt-1.5 font-mono text-[11px] text-accent2">{usernameError}</p>
            ) : (
              <p className="mt-1.5 font-mono text-[11px] text-faint">
                a-z 0-9 . _ - · เปลี่ยนได้ทุก {USERNAME_COOLDOWN_DAYS} วัน
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 flex items-center justify-between gap-2 text-xs font-mono text-muted"
            >
              <span>ไบโอ</span>
              <span className={bioCount >= BIO_MAX ? 'text-accent2' : 'text-faint'}>
                {bioCount}/{BIO_MAX}
              </span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(clampTo(e.target.value, BIO_MAX))}
              rows={2}
              placeholder={`แนะนำตัวสั้น ๆ (ไม่เกิน ${BIO_MAX} ตัว)`}
              className="w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-all focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={!dirty || saving || Boolean(usernameError)}
              className="rounded-lg border border-accent/60 bg-accent/10 px-5 py-2.5 font-mono text-sm text-accent transition-all hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>

            {dirty && !saving && (
              <button
                type="button"
                onClick={() => {
                  setDisplayName(baseName)
                  setAvatarUrl(baseAvatar)
                  setBio(baseBio)
                  setUsername(baseUsername)
                }}
                className="rounded-lg border border-line px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent2/50 hover:text-accent2"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </div>

        {/* เปลี่ยนชื่อผู้ใช้แล้วรออีก 14 วัน และลิงก์เดิมพัง จึงต้องถามให้แน่ใจก่อน */}
        <ConfirmDialog
          open={confirmOpen}
          tone="danger"
          title="ยืนยันเปลี่ยนชื่อผู้ใช้?"
          description={`เปลี่ยนจาก @${baseUsername} เป็น @${username} · หลังจากนี้จะเปลี่ยนได้อีกครั้งใน ${USERNAME_COOLDOWN_DAYS} วัน และลิงก์โปรไฟล์เดิม /u/${baseUsername} จะใช้ไม่ได้อีก`}
          confirmLabel="เปลี่ยนเลย"
          busy={saving}
          onConfirm={handleSave}
          onCancel={() => setConfirmOpen(false)}
        />

        {localOnly && (
          <p className="mt-3 rounded-lg border border-accent2/40 bg-accent2/5 px-3 py-2 text-xs text-accent2">
            รูปนี้เก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น คนอื่นยังไม่เห็น และจะหายถ้าล้างข้อมูลเบราว์เซอร์
            <br />
            แก้ถาวรได้ด้วยการเปลี่ยนชนิดคอลัมน์ profiles.avatar_url เป็น text
          </p>
        )}
      </div>
    </div>
  )
}
