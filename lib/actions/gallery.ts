'use server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { galleryInputToRow, galleryItemSchema, type GalleryRow } from '@/lib/content/gallery'
import { fieldErrors, type ActionResult } from '@/lib/content/errors'
import { guarded } from './guard'

const COLUMNS = 'id, kind, category, image, video_url, youtube_id, caption, alt, width, height, position'

function revalidateGallery() {
  revalidatePath('/') // homepage Visuals row
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}

/** Adds one or more items to the end of the gallery. */
export async function addGalleryItems(inputs: unknown[]): Promise<ActionResult<GalleryRow[]>> {
  return guarded(async () => {
    if (!Array.isArray(inputs) || !inputs.length || inputs.length > 50) return { ok: false, message: 'Add between 1 and 50 items at a time.' }
    const rows = []
    for (const input of inputs) {
      const parsed = galleryItemSchema.safeParse(input)
      if (!parsed.success) return { ok: false, message: Object.values(fieldErrors(parsed.error))[0] ?? 'Invalid item.' }
      rows.push(galleryInputToRow(parsed.data))
    }
    const supabase = adminClient()
    const { data: last, error: lastError } = await supabase.from('jada_gallery').select('position').order('position', { ascending: false }).limit(1).maybeSingle()
    if (lastError) throw lastError
    const start = (last?.position ?? 0) + 1
    const { data, error } = await supabase
      .from('jada_gallery')
      .insert(rows.map((r, i) => ({ ...r, position: start + i })))
      .select(COLUMNS)
    if (error) throw error
    revalidateGallery()
    return { ok: true, data }
  })
}

export async function updateGalleryItem(id: string, input: unknown): Promise<ActionResult<GalleryRow>> {
  return guarded(async () => {
    const parsed = galleryItemSchema.safeParse(input)
    if (!parsed.success) return { ok: false, message: 'Some fields need attention.', errors: fieldErrors(parsed.error) }
    const { data, error } = await adminClient().from('jada_gallery').update(galleryInputToRow(parsed.data)).eq('id', id).select(COLUMNS).maybeSingle()
    if (error) throw error
    if (!data) return { ok: false, message: 'This item no longer exists.' }
    revalidateGallery()
    return { ok: true, data }
  })
}

export async function deleteGalleryItem(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { error } = await adminClient().from('jada_gallery').delete().eq('id', id)
    if (error) throw error
    revalidateGallery()
    return { ok: true }
  })
}

/** Swaps an item with its neighbour (direction -1 = earlier, 1 = later). */
export async function moveGalleryItem(id: string, direction: number): Promise<ActionResult> {
  return guarded(async () => {
    const supabase = adminClient()
    const { data: items, error } = await supabase.from('jada_gallery').select('id, position').order('position')
    if (error) throw error
    const i = items.findIndex((item) => item.id === id)
    const j = i + (direction < 0 ? -1 : 1)
    if (i < 0 || j < 0 || j >= items.length) return { ok: true }
    const [a, b] = [items[i], items[j]]
    const results = await Promise.all([
      supabase.from('jada_gallery').update({ position: b.position }).eq('id', a.id),
      supabase.from('jada_gallery').update({ position: a.position }).eq('id', b.id),
    ])
    const failed = results.find((r) => r.error)
    if (failed?.error) throw failed.error
    revalidateGallery()
    return { ok: true }
  })
}
