'use server'
import { adminClient, MEDIA_BUCKET } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/content/errors'
import { guarded } from './guard'
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/content/images'

const FOLDERS = ['sections', 'journal', 'seo'] as const

/** Issues a one-time signed URL so the browser uploads straight to Supabase (no server body-size limit). */
export async function createImageUpload(input: { type: string; size: number; folder: string }): Promise<ActionResult<{ path: string; token: string; publicUrl: string }>> {
  return guarded(async () => {
    const ext = IMAGE_TYPES[input.type as keyof typeof IMAGE_TYPES]
    if (!ext) return { ok: false, message: 'Use a JPG, PNG, WebP or AVIF image.' }
    if (!(input.size > 0 && input.size <= MAX_IMAGE_BYTES)) return { ok: false, message: 'Images must be 8 MB or smaller.' }
    const folder = FOLDERS.find((f) => f === input.folder) ?? 'sections'

    const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`
    const storage = adminClient().storage.from(MEDIA_BUCKET)
    const { data, error } = await storage.createSignedUploadUrl(path)
    if (error) throw error
    return { ok: true, data: { path, token: data.token, publicUrl: storage.getPublicUrl(path).data.publicUrl } }
  })
}
