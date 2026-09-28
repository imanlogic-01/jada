'use client'
import { createUpload } from '@/lib/actions/upload'
import { checkFile, type UploadFolder } from '@/lib/content/media'

export type UploadResult = { url: string } | { error: string }

/**
 * Uploads a file straight to Supabase Storage through a signed URL issued by the server
 * after the admin check. Uses XHR (not fetch) so large videos can report progress.
 */
export async function uploadFile(file: File, folder: UploadFolder, accept: 'image' | 'video' | 'any', onProgress?: (fraction: number) => void): Promise<UploadResult> {
  const problem = checkFile(file, accept)
  if (problem) return { error: problem }
  let ticket
  try {
    ticket = await createUpload({ type: file.type, size: file.size, folder })
  } catch {
    return { error: 'Could not reach the server. Check your connection and try again.' }
  }
  if (!ticket.ok || !ticket.data) return { error: ticket.ok ? 'Upload failed. Please try again.' : ticket.message }
  const { uploadUrl, publicUrl } = ticket.data

  const body = new FormData()
  body.append('cacheControl', '31536000')
  body.append('', file)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return new Promise<UploadResult>((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('apikey', key)
    xhr.setRequestHeader('authorization', `Bearer ${key}`)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? { url: publicUrl } : { error: 'Upload failed. Please try again.' })
    xhr.onerror = () => resolve({ error: 'Upload failed. Check your connection and try again.' })
    xhr.send(body)
  })
}

/** Reads an image's pixel size in the browser (used to lay out the gallery without cropping). */
export async function imageSize(src: File | string): Promise<{ width: number; height: number } | null> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return null
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url)
  }
}
