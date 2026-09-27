export const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' } as const
export const VIDEO_TYPES = { 'video/mp4': 'mp4', 'video/webm': 'webm' } as const
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
// Supabase's free plan caps a single upload at 50 MB.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export const isImageType = (type: string): type is keyof typeof IMAGE_TYPES => type in IMAGE_TYPES
export const isVideoType = (type: string): type is keyof typeof VIDEO_TYPES => type in VIDEO_TYPES
export const UPLOAD_FOLDERS = ['sections', 'journal', 'seo', 'gallery'] as const
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number]

/** Checks a file before uploading; returns a friendly message if it can't be used. */
export function checkFile(file: { type: string; size: number }, accept: 'image' | 'video' | 'any'): string | null {
  const mb = (file.size / 1024 / 1024).toFixed(1)
  const image = isImageType(file.type)
  const video = isVideoType(file.type)
  if (accept === 'image' && !image) return 'Use a JPG, PNG, WebP or AVIF image.'
  if (accept === 'video' && !video) return 'Use an MP4 or WebM video. In Canva: Share → Download → MP4 Video.'
  if (accept === 'any' && !image && !video) return 'Use a JPG, PNG, WebP or AVIF image, or an MP4 video.'
  if (image && file.size > MAX_IMAGE_BYTES) return `This image is ${mb} MB. Images must be 8 MB or smaller.`
  if (video && file.size > MAX_VIDEO_BYTES) return `This video is ${mb} MB. Videos must be 50 MB or smaller. Export at 1080p or shorten it, or use a YouTube link instead.`
  return null
}
