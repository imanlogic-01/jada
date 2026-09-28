import { z } from 'zod'
import { IMAGE_SRC } from './sections'

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

const limit = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`)

export const postSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the post a title').max(140, 'Keep this under 140 characters'),
    slug: z.string().trim().min(1, 'Required').max(80, 'Keep this under 80 characters').regex(SLUG, 'Use lowercase letters, numbers and hyphens only'),
    excerpt: limit(300),
    bodyHtml: z.string().max(200_000, 'This post is too long'),
    cover: z.object({
      src: z.string().refine((v) => v === '' || IMAGE_SRC.test(v), 'Upload the image again'),
      alt: limit(160),
    }),
    status: z.enum(['draft', 'published']),
    publishedAt: z.string().refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Enter a valid date'),
    seoTitle: limit(70),
    seoDescription: limit(170),
  })
  .superRefine((post, ctx) => {
    if (post.cover.src && !post.cover.alt) ctx.addIssue({ code: 'custom', path: ['cover', 'alt'], message: 'Describe the image for screen readers' })
    if (post.status !== 'published') return
    if (!post.publishedAt) ctx.addIssue({ code: 'custom', path: ['publishedAt'], message: 'Set a publish date' })
    else if (Date.parse(post.publishedAt) > Date.now() + 5 * 60_000)
      ctx.addIssue({ code: 'custom', path: ['publishedAt'], message: 'The publish date can’t be in the future' })
    if (!post.bodyHtml.replace(/<[^>]*>/g, '').trim()) ctx.addIssue({ code: 'custom', path: ['bodyHtml'], message: 'Write something before publishing' })
  })

export type PostInput = z.infer<typeof postSchema>

export type PostRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  body_html: string
  cover_image: string | null
  cover_alt: string
  status: 'draft' | 'published'
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export const emptyPost: PostInput = {
  title: '',
  slug: '',
  excerpt: '',
  bodyHtml: '',
  cover: { src: '', alt: '' },
  status: 'draft',
  publishedAt: '',
  seoTitle: '',
  seoDescription: '',
}

export function rowToInput(row: PostRow): PostInput {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    bodyHtml: row.body_html,
    cover: { src: row.cover_image ?? '', alt: row.cover_alt },
    status: row.status,
    publishedAt: row.published_at ?? '',
    seoTitle: row.seo_title ?? '',
    seoDescription: row.seo_description ?? '',
  }
}
