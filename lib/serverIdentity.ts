import 'server-only'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const COOKIE = 'prompt-library-visitor'

export async function serverIdentity(createGuest = false) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error && error.name !== 'AuthSessionMissingError') throw new Error('กรุณาเข้าสู่ระบบใหม่')
  const jar = await cookies()
  let token = jar.get(COOKIE)?.value
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = undefined
    if (createGuest && !user) {
      token = randomBytes(32).toString('hex')
      jar.set(COOKIE, token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
      })
    }
  }
  return { actor: user?.id ?? null, guest: token ? createHash('sha256').update(token).digest('hex') : null }
}

export async function rateLimitKey(scope: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Server database credentials are not configured')
  const h = await headers()
  // Configure only a header that the deployment's trusted proxy OVERWRITES.
  // A shared fallback bucket cannot be bypassed with client-supplied IP headers.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER
  const ip = header ? h.get(header)?.split(',')[0].trim() : undefined
  return createHmac('sha256', secret).update(`${scope}:${ip || 'shared'}`).digest('hex')
}
