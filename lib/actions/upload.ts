'use server'
import { adminClient, MEDIA_BUCKET } from '@/lib/supabase/admin'
import type { ActionResult } from '@/lib/content/errors'
import { checkFile, IMAGE_TYPES, UPLOAD_FOLDERS, VIDEO_TYPES } from '@/lib/content/media'
import { guarded } from './guard'

/** Issues a one-time signed URL so the browser uploads straight to Supabase (no server body-size limit). */
export async function createUpload(input: { type: string; size: number; folder: string }): Promise<ActionResult<{ uploadUrl: string; publicUrl: string }>> {
  return guarded(async () => {
    const problem = checkFile(input, 'any')
    if (problem || !(input.size > 0)) return { ok: false, message: problem ?? 'This file is empty.' }
    const ext = { ...IMAGE_TYPES, ...VIDEO_TYPES }[input.type as keyof typeof IMAGE_TYPES & keyof typeof VIDEO_TYPES]
    const folder = UPLOAD_FOLDERS.find((f) => f === input.folder) ?? 'sections'

    const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`
    const storage = adminClient().storage.from(MEDIA_BUCKET)
    const { data, error } = await storage.createSignedUploadUrl(path)
    if (error) throw error
    return { ok: true, data: { uploadUrl: data.signedUrl, publicUrl: storage.getPublicUrl(path).data.publicUrl } }
  })
}
