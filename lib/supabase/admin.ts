import 'server-only'
import { createClient } from '@supabase/supabase-js'

// This client bypasses RLS. Call only the restricted RPCs after verifying identity.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Server database credentials are not configured')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
