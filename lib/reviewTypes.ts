export type Review = {
  review_id: string
  rating: number
  comment: string | null
  guest_name: string | null
  created_at: string
  is_anonymous: boolean
  can_manage: boolean
  is_member: boolean
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
}
