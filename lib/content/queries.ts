import 'server-only'
import { cache } from 'react'
import { publicClient } from '@/lib/supabase/public'
import { sectionDefaults, sectionSchemas, isSectionKey, type Sections } from './sections'
import { seoDefaults, seoSchema, type SeoInput, type SeoPath } from './seo'
import type { PostRow } from './posts'

// Public reads. Without Supabase configured (local preview) they fall back to today's copy.
// A real database error is thrown so Next.js keeps serving the last good version of the page.

export const getSections = cache(async (): Promise<Sections> => {
  const sections = structuredClone(sectionDefaults)
  const supabase = publicClient()
  if (!supabase) return sections
  const { data, error } = await supabase.from('jada_sections').select('key, content')
  if (error) throw new Error(`Could not load site content: ${error.message}`)
  for (const row of data) {
    if (!isSectionKey(row.key)) continue
    const parsed = sectionSchemas[row.key].safeParse(row.content)
    if (parsed.success) Object.assign(sections, { [row.key]: parsed.data })
    else console.error(`Stored content for "${row.key}" is invalid; using defaults.`, parsed.error.issues)
  }
  return sections
})

export const getPageSeo = cache(async (path: SeoPath): Promise<SeoInput> => {
  const supabase = publicClient()
  if (!supabase) return seoDefaults[path]
  const { data, error } = await supabase.from('jada_page_seo').select('title, description, og_image').eq('path', path).maybeSingle()
  if (error) throw new Error(`Could not load SEO settings: ${error.message}`)
  if (!data) return seoDefaults[path]
  const parsed = seoSchema.safeParse({ title: data.title, description: data.description, ogImage: data.og_image ?? '' })
  return parsed.success ? parsed.data : seoDefaults[path]
})

export type PostSummary = Pick<PostRow, 'slug' | 'title' | 'excerpt' | 'cover_image' | 'cover_alt' | 'published_at'>
const SUMMARY = 'slug, title, excerpt, cover_image, cover_alt, published_at'

export const getPublishedPosts = cache(async (limit?: number): Promise<PostSummary[]> => {
  const supabase = publicClient()
  if (!supabase) return []
  let query = supabase.from('jada_posts').select(SUMMARY).order('published_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw new Error(`Could not load journal posts: ${error.message}`)
  return data
})

export const getPublishedPost = cache(async (slug: string): Promise<PostRow | null> => {
  const supabase = publicClient()
  if (!supabase) return null
  const { data, error } = await supabase.from('jada_posts').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(`Could not load journal post: ${error.message}`)
  return data
})
