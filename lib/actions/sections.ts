'use server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { isSectionKey, sectionSchemas } from '@/lib/content/sections'
import { fieldErrors, type ActionResult } from '@/lib/content/errors'
import { guarded } from './guard'

export async function saveSection(key: string, content: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  return guarded(async () => {
    if (!isSectionKey(key)) return { ok: false, message: 'Unknown section.' }
    const parsed = sectionSchemas[key].safeParse(content)
    if (!parsed.success) return { ok: false, message: 'Some fields need attention.', errors: fieldErrors(parsed.error) }

    const { data, error } = await adminClient().from('jada_sections').upsert({ key, content: parsed.data }).select('updated_at').single()
    if (error) throw error

    // Menu, footer and socials appear on every public page, so refresh them all.
    revalidatePath('/', 'layout')
    return { ok: true, data: { updatedAt: data.updated_at } }
  })
}
