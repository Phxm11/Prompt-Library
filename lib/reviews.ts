'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitKey, serverIdentity } from '@/lib/serverIdentity'
import type { Review } from '@/lib/reviewTypes'

export async function listReviews(promptId: string) {
  try {
    const { actor, guest } = await serverIdentity()
    const { data, error } = await createAdminClient().rpc('read_prompt_reviews', {
      target_prompt: promptId, actor_id: actor, guest_hash: guest,
    })
    if (error) throw error
    return { reviews: (data ?? []) as Review[], error: null }
  } catch {
    return { reviews: [] as Review[], error: 'โหลดรีวิวไม่สำเร็จ กรุณาลองใหม่' }
  }
}

export async function writeReview(input: {
  action: 'create' | 'update' | 'delete'
  promptId: string
  reviewId?: string
  rating?: number
  comment?: string
  guestName?: string
  anonymous?: boolean
}) {
  try {
    const { actor, guest } = await serverIdentity(input.action === 'create')
    const { error } = await createAdminClient().rpc('write_prompt_review', {
      operation: input.action, target_prompt: input.promptId,
      target_review: input.reviewId ?? null, actor_id: actor, guest_hash: guest,
      new_rating: input.rating ?? null, new_comment: input.comment ?? null,
      new_guest_name: input.guestName ?? null, hide_author: input.anonymous ?? true,
      bucket_key: await rateLimitKey('reviews'),
    })
    if (error) throw error
    return { error: null }
  } catch {
    return { error: 'บันทึกรีวิวไม่สำเร็จ กรุณาตรวจสิทธิ์ ข้อความ หรือเว้นช่วงแล้วลองใหม่' }
  }
}
