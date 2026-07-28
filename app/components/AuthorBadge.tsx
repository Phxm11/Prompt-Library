import Link from 'next/link'

type Author = {
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
} | null

/**
 * แถบแสดงคนโพสต์ prompt
 *
 * prompt ชุดที่มากับข้อมูลตั้งต้นมี user_id เป็น null (ไม่มีเจ้าของ)
 * จึงต้องรองรับกรณีไม่มีข้อมูลผู้โพสต์ด้วย ไม่ใช่ปล่อยให้พัง
 */
export default function AuthorBadge({
  author,
  createdAt,
  size = 32,
}: {
  author: Author
  createdAt?: string | null
  size?: number
}) {
  const name = author?.display_name?.trim() || author?.username || 'ไม่ระบุผู้โพสต์'
  const initial = name.charAt(0).toUpperCase()

  // prompt ชุดตั้งต้นไม่มีเจ้าของ กดเข้าโปรไฟล์ไม่ได้
  const profileHref = author?.username ? `/u/${encodeURIComponent(author.username)}` : null

  const inner = (
    <>
      <div
        className="shrink-0 overflow-hidden rounded-full border border-accent/40 bg-base"
        style={{ width: size, height: size }}
      >
        {author?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="grid h-full w-full place-items-center bg-accent/10 font-display font-extrabold text-accent"
            style={{ fontSize: size * 0.42 }}
          >
            {initial}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm text-ink-soft">
          โพสต์โดย <span className="font-semibold text-ink">{name}</span>
        </p>
        {createdAt && (
          <p className="text-xs font-mono text-faint">
            {new Date(createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
          </p>
        )}
      </div>
    </>
  )

  if (!profileHref) return <div className="flex items-center gap-2.5">{inner}</div>

  return (
    <Link
      href={profileHref}
      className="flex items-center gap-2.5 rounded-lg transition-colors hover:text-accent [&_.text-ink]:hover:text-accent"
    >
      {inner}
    </Link>
  )
}
