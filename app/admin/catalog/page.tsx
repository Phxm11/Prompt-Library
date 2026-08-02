import { createClient } from '@/lib/supabase/server'
import CatalogTabs from '@/app/admin/catalog/CatalogTabs'

export default async function AdminCatalogPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: mediaTypes }, { data: aiModels }, { data: tags }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('category_id, name, slug, description, icon, sort_order, is_active')
        .order('sort_order'),
      supabase.from('media_types').select('media_type_id, name, slug, icon').order('name'),
      supabase
        .from('ai_models')
        .select('ai_model_id, name, provider, media_type_id, website_url, is_active')
        .order('name'),
      supabase.from('tags').select('tag_id, name').order('name'),
    ])

  return (
    <div>
      <h1 className="section-title text-3xl font-extrabold mb-2 text-ink">
        จัดการหมวดหมู่ &amp; ข้อมูลอ้างอิง
      </h1>
      <p className="text-sm text-muted font-mono mb-8">
        หมวดหมู่ ประเภทสื่อ AI Model และแท็ก ที่ใช้กำกับ Prompt ทั่วทั้งเว็บ
      </p>

      <CatalogTabs
        categories={categories ?? []}
        mediaTypes={mediaTypes ?? []}
        aiModels={aiModels ?? []}
        tags={tags ?? []}
      />
    </div>
  )
}
