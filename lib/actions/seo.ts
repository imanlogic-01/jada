'use server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { isSeoPath, seoSchema } from '@/lib/content/seo'
import { fieldErrors, type ActionResult } from '@/lib/content/errors'
import { guarded } from './guard'

export async function saveSeo(path: string, input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  return guarded(async () => {
    if (!isSeoPath(path)) return { ok: false, message: 'Unknown page.' }
    const parsed = seoSchema.safeParse(input)
    if (!parsed.success) return { ok: false, message: 'Some fields need attention.', errors: fieldErrors(parsed.error) }

    const { title, description, ogImage } = parsed.data
    const { data, error } = await adminClient()
      .from('jada_page_seo')
      .upsert({ path, title, description, og_image: ogImage || null })
      .select('updated_at')
      .single()
    if (error) throw error

    revalidatePath(path)
    return { ok: true, data: { updatedAt: data.updated_at } }
  })
}
