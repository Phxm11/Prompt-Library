'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitKey, serverIdentity } from '@/lib/serverIdentity'

export async function recordCopy(promptId: string): Promise<{ counted: boolean; rateLimited?: boolean }> {
  try {
    const { actor, guest } = await serverIdentity(true)
    const { data, error } = await createAdminClient().rpc('record_prompt_copy', {
      target_prompt: promptId, actor_id: actor, guest_hash: guest,
      bucket_key: await rateLimitKey('copies'),
    })
    if (error) throw error
    return { counted: data?.counted === true, rateLimited: data?.rateLimited === true }
  } catch {
    // Clipboard success is independent of analytics availability.
    console.error('Copy count could not be recorded')
    return { counted: false }
  }
}
