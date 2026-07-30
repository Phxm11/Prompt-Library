import { createClient } from '@/lib/supabase/server'
import AdminUserActions from '@/app/admin/users/AdminUserActions'
import AdminUserFilters from '@/app/admin/users/AdminUserFilters'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { role, status, q } = await searchParams

  let query = supabase
    .from('profiles')
    .select(
      'id, username, display_name, role, is_banned, banned_reason, banned_until, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (role) query = query.eq('role', role)
  if (status) query = query.eq('is_banned', status === 'banned')

  /*
    ค้นทั้ง username และชื่อเล่นด้วยคำเดียว
    ต้อง escape % _ \ ก่อน เพราะเป็นอักขระพิเศษของ LIKE
    และ escape , ด้วย เพราะ .or() ใช้จุลภาคคั่นเงื่อนไข ถ้าไม่กันจะแตกเป็นสองเงื่อนไข
  */
  if (q) {
    const keyword = q.replace(/[%_\\]/g, (ch) => `\\${ch}`).replace(/,/g, '')
    query = query.or(`username.ilike.%${keyword}%,display_name.ilike.%${keyword}%`)
  }

  const { data: users, error, count } = await query

  return (
    <div>
      <h1 className="animate-spring-up section-title text-3xl font-extrabold text-ink mb-6">
        จัดการผู้ใช้
      </h1>

      {error && <p className="text-accent2">เกิดข้อผิดพลาด: {error.message}</p>}

      <div className="animate-spring-up [animation-delay:60ms] relative z-20">
        <AdminUserFilters total={count ?? users?.length ?? 0} />
      </div>

      <div className="animate-spring-up [animation-delay:120ms] rounded-xl bg-surface border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-faint font-mono text-xs">
              <th className="px-4 py-3">ผู้ใช้</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">สมัครเมื่อ</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="text-ink">{u.display_name || u.username}</p>
                  <p className="text-faint text-xs font-mono">@{u.username}</p>
                </td>
                <td className="px-4 py-3">
                  {/*
                    is_banned ยังเป็น true หลังหมดกำหนด เพราะไม่มีใครไปไล่ล้างค่าให้
                    ตัวตัดสินจริงคือ banned_until เทียบกับตอนนี้ ซึ่งตรงกับที่ is_user_banned() ในฐานข้อมูลใช้
                  */}
                  {u.is_banned && (!u.banned_until || new Date(u.banned_until) > new Date()) ? (
                    <div className="space-y-1">
                      <span
                        className="inline-block text-xs font-mono px-2 py-0.5 rounded-full bg-accent2/10 text-accent2"
                        title={u.banned_reason ?? ''}
                      >
                        {u.banned_until ? 'ถูกแบนชั่วคราว' : 'ถูกแบนถาวร'}
                      </span>
                      {u.banned_until && (
                        <p className="text-[11px] font-mono text-faint">
                          ถึง{' '}
                          {new Date(u.banned_until).toLocaleString('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      )}
                      {u.banned_reason && (
                        <p className="max-w-[200px] truncate text-[11px] text-muted" title={u.banned_reason}>
                          {u.banned_reason}
                        </p>
                      )}
                    </div>
                  ) : u.is_banned ? (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-line text-muted">
                      แบนหมดอายุแล้ว
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                      ปกติ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-faint font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">
                  <AdminUserActions
                    userId={u.id}
                    currentRole={u.role}
                    isBanned={u.is_banned}
                    displayName={u.display_name || u.username}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users?.length === 0 && (
          <p className="text-center py-10 text-faint font-mono text-sm">ยังไม่มีผู้ใช้</p>
        )}
      </div>
    </div>
  )
}
