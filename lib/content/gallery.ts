import { z } from 'zod'
import { IMAGE_SRC, youtube } from './sections'

export const GALLERY_CATEGORIES = [
  { value: 'project', label: 'Project' },
  { value: 'behind-the-scenes', label: 'Behind the scenes' },
] as const
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]['value']
export const categoryLabel = (value: string) => GALLERY_CATEGORIES.find((c) => c.value === value)?.label ?? value

const media = (message: string) => z.string().refine((v) => v === '' || IMAGE_SRC.test(v), message)
const size = z.number().int().positive().max(20000).nullable()

export const galleryItemSchema = z
  .object({
    kind: z.enum(['image', 'video']),
    category: z.enum(['project', 'behind-the-scenes']),
    image: media('Upload the image again'),
    videoUrl: media('Upload the video again'),
    youtubeId: youtube,
    caption: z.string().trim().max(140, 'Keep this under 140 characters'),
    alt: z.string().trim().max(160, 'Keep this under 160 characters'),
    width: size,
    height: size,
  })
  .superRefine((item, ctx) => {
    if (item.kind === 'image' && !item.image) ctx.addIssue({ code: 'custom', path: ['image'], message: 'Add a photo' })
    if (item.kind === 'video' && !item.videoUrl && !item.youtubeId) ctx.addIssue({ code: 'custom', path: ['youtubeId'], message: 'Upload a video or paste a YouTube link' })
  })
export type GalleryInput = z.infer<typeof galleryItemSchema>

export type GalleryRow = {
  id: string
  kind: 'image' | 'video'
  category: GalleryCategory
  image: string | null
  video_url: string | null
  youtube_id: string | null
  caption: string
  alt: string
  width: number | null
  height: number | null
  position: number
}

export const rowToGalleryInput = (r: GalleryRow): GalleryInput => ({
  kind: r.kind,
  category: r.category,
  image: r.image ?? '',
  videoUrl: r.video_url ?? '',
  youtubeId: r.youtube_id ?? '',
  caption: r.caption,
  alt: r.alt,
  width: r.width,
  height: r.height,
})

export const galleryInputToRow = (i: GalleryInput) => ({
  kind: i.kind,
  category: i.category,
  image: i.image || null,
  video_url: i.kind === 'video' ? i.videoUrl || null : null,
  youtube_id: i.kind === 'video' ? i.youtubeId || null : null,
  caption: i.caption,
  alt: i.alt,
  width: i.width,
  height: i.height,
})

/** What to show for an item: its own image, or YouTube's thumbnail for a link-only video. */
export const galleryThumb = (r: Pick<GalleryRow, 'image' | 'youtube_id'>) => r.image || (r.youtube_id ? `https://i.ytimg.com/vi/${r.youtube_id}/hqdefault.jpg` : '')

/** Width ÷ height, kept within sensible bounds so one odd file can't break the layout. */
export const galleryRatio = (r: Pick<GalleryRow, 'width' | 'height'>) => (r.width && r.height ? Math.min(2.2, Math.max(0.55, r.width / r.height)) : 16 / 9)
