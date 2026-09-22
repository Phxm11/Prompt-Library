import type { SupabaseClient } from '@supabase/supabase-js'
import { promptSearchFilter } from './promptSearch'

export const PAGE_SIZE = 12
export const PROMPT_COLUMNS = 'prompt_id,title,prompt_text,cover_image_url,cover_position,cover_zoom,status,view_count,like_count,copy_count,categories(name),media_types(name)'
export type PromptSummary = {
  prompt_id: string
  title: string
  prompt_text: string
  cover_image_url: string | null
  cover_position?: string | null
  cover_zoom?: number | null
  status?: string | null
  view_count: number
  like_count: number
  copy_count: number
  categories: { name: string } | null
  media_types: { name: string } | null
}

export function promptPageQuery(supabase: SupabaseClient, filters: {
  categoryId?: string | null
  mediaTypeId?: string | null
  aiModelId?: string | null
  query?: string
}, from = 0) {
  const columns = filters.aiModelId ? `${PROMPT_COLUMNS},prompt_ai_models!inner(ai_model_id)` : PROMPT_COLUMNS
  let q = supabase.from('prompts').select(columns)
    .eq('is_public', true).eq('status', 'published')
    .order('created_at', { ascending: false }).order('prompt_id', { ascending: true })
    .range(from, from + PAGE_SIZE)
  if (filters.categoryId) q = q.eq('category_id', filters.categoryId)
  if (filters.mediaTypeId) q = q.eq('media_type_id', filters.mediaTypeId)
  if (filters.aiModelId) q = q.eq('prompt_ai_models.ai_model_id', filters.aiModelId)
  if (filters.query) q = q.or(promptSearchFilter(filters.query))
  return q.overrideTypes<PromptSummary[], { merge: false }>()
}
