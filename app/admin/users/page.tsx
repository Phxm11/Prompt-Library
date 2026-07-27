import { createClient } from '@/lib/supabase/server'
import AdminUserActions from '@/app/admin/users/AdminUserActions'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, is_banned, banned_reason, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-fuchsia-400/80 font-mono mb-2 uppercase">
        // users
      </p>
      <h1
        className="text-2xl font-bold text-[#f2f2f7] mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        จัดการผู้ใช้
      </h1>

      {error && <p className="text-fuchsia-400">เกิดข้อผิดพลาด: {error.message}</p>}

      <div className="rounded-xl bg-[#12121c] border border-[#232336] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#232336] text-left text-[#666680] font-mono text-xs">
              <th className="px-4 py-3">ผู้ใช้</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">สมัครเมื่อ</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-[#232336] last:border-0">
                <td className="px-4 py-3">
                  <p className="text-[#f2f2f7]">{u.display_name || u.username}</p>
                  <p className="text-[#666680] text-xs font-mono">@{u.username}</p>
                </td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300"
                      title={u.banned_reason ?? ''}
                    >
                      ถูกแบน
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                      ปกติ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#666680] font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">
                  <AdminUserActions userId={u.id} currentRole={u.role} isBanned={u.is_banned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users?.length === 0 && (
          <p className="text-center py-10 text-[#666680] font-mono text-sm">ยังไม่มีผู้ใช้</p>
        )}
      </div>
    </div>
  )
}