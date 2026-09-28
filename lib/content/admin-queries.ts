import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { sectionDefaults, sectionSchemas, type SectionContent, type SectionKey } from './sections'
import { SEO_PAGES, seoDefaults, type SeoInput, type SeoPath } from './seo'
import type { PostRow } from './posts'
import type { BookingRow, BookingStatus } from './booking'
import type { GalleryRow } from './gallery'

// Admin reads use the service-role client. Every caller sits behind the admin layout guard.

type Result = { data: unknown; error: { message: string } | null }

function check<R extends Result>(result: R, what: string): R['data'] {
  if (result.error) throw new Error(`Could not load ${what}: ${result.error.message}`)
  return result.data
}
const list = <R extends Result>(result: R, what: string): NonNullable<R['data']> => check(result, what) ?? []

export async function getSectionForEdit<K extends SectionKey>(key: K): Promise<{ content: SectionContent<K>; updatedAt: string | null }> {
  const row = check(await adminClient().from('jada_sections').select('content, updated_at').eq('key', key).maybeSingle(), 'this section')
  if (!row) return { content: sectionDefaults[key], updatedAt: null }
  // Stored content is layered over the defaults so fields added later get a sensible starting value.
  const merged = { ...sectionDefaults[key], ...(row.content as object) }
  const parsed = sectionSchemas[key].safeParse(merged)
  const content = (parsed.success ? parsed.data : merged) as SectionContent<K>
  return { content, updatedAt: row.updated_at }
}

export async function getSectionUpdates(): Promise<Partial<Record<SectionKey, string>>> {
  const rows = list(await adminClient().from('jada_sections').select('key, updated_at'), 'sections')
  return Object.fromEntries(rows.map((r) => [r.key, r.updated_at]))
}

export async function getSeoForEdit(): Promise<Record<SeoPath, SeoInput & { updatedAt: string | null }>> {
  const rows = list(await adminClient().from('jada_page_seo').select('path, title, description, og_image, updated_at'), 'SEO settings')
  return Object.fromEntries(
    SEO_PAGES.map(({ path }) => {
      const row = rows.find((r) => r.path === path)
      return [path, row ? { title: row.title, description: row.description, ogImage: row.og_image ?? '', updatedAt: row.updated_at } : { ...seoDefaults[path], updatedAt: null }]
    }),
  ) as Record<SeoPath, SeoInput & { updatedAt: string | null }>
}

export type PostListItem = Pick<PostRow, 'id' | 'slug' | 'title' | 'status' | 'published_at' | 'updated_at' | 'cover_image'>

export async function listPosts(): Promise<PostListItem[]> {
  return list(
    await adminClient().from('jada_posts').select('id, slug, title, status, published_at, updated_at, cover_image').order('updated_at', { ascending: false }),
    'posts',
  )
}

export async function getPost(id: string): Promise<PostRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return check(await adminClient().from('jada_posts').select('*').eq('id', id).maybeSingle(), 'this post')
}

export async function listBookings(status?: BookingStatus): Promise<BookingRow[]> {
  let query = adminClient().from('jada_bookings').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  return list(await query, 'booking requests')
}

export async function getBooking(id: string): Promise<BookingRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return check(await adminClient().from('jada_bookings').select('*').eq('id', id).maybeSingle(), 'this booking request')
}

export async function countNewBookings(): Promise<number> {
  const { count, error } = await adminClient().from('jada_bookings').select('id', { count: 'exact', head: true }).eq('status', 'new')
  if (error) throw new Error(`Could not count booking requests: ${error.message}`)
  return count ?? 0
}

export async function listGallery(): Promise<GalleryRow[]> {
  return list(await adminClient().from('jada_gallery').select('id, kind, category, image, video_url, youtube_id, caption, alt, width, height, position').order('position'), 'the gallery')
}
