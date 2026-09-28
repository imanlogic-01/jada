'use server'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@/lib/supabase/admin'
import { postSchema } from '@/lib/content/posts'
import { sanitizePostHtml } from '@/lib/content/sanitize'
import { fieldErrors, type ActionResult } from '@/lib/content/errors'
import { guarded } from './guard'

function revalidateJournal(...slugs: (string | null | undefined)[]) {
  revalidatePath('/') // homepage journal panel
  revalidatePath('/journal')
  revalidatePath('/sitemap.xml')
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/journal/${slug}`)
}

export async function savePost(id: string | null, input: unknown): Promise<ActionResult<{ id: string; slug: string; updatedAt: string }>> {
  return guarded(async () => {
    const parsed = postSchema.safeParse(input)
    if (!parsed.success) return { ok: false, message: 'Some fields need attention.', errors: fieldErrors(parsed.error) }
    const post = parsed.data
    const supabase = adminClient()

    const row = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body_html: sanitizePostHtml(post.bodyHtml),
      cover_image: post.cover.src || null,
      cover_alt: post.cover.src ? post.cover.alt : '',
      status: post.status,
      published_at: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      seo_title: post.seoTitle || null,
      seo_description: post.seoDescription || null,
    }

    let previousSlug: string | null = null
    if (id) {
      const { data: existing, error } = await supabase.from('jada_posts').select('slug').eq('id', id).maybeSingle()
      if (error) throw error
      if (!existing) return { ok: false, message: 'This post no longer exists. It may have been deleted.' }
      previousSlug = existing.slug
    }

    const { data, error } = id
      ? await supabase.from('jada_posts').update(row).eq('id', id).select('id, slug, updated_at').single()
      : await supabase.from('jada_posts').insert(row).select('id, slug, updated_at').single()
    if (error?.code === '23505') return { ok: false, message: 'Some fields need attention.', errors: { slug: 'Another post already uses this web address' } }
    if (error) throw error

    revalidateJournal(data.slug, previousSlug)
    revalidatePath('/admin/journal')
    return { ok: true, data: { id: data.id, slug: data.slug, updatedAt: data.updated_at } }
  })
}

export async function deletePost(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { data, error } = await adminClient().from('jada_posts').delete().eq('id', id).select('slug').maybeSingle()
    if (error) throw error
    revalidateJournal(data?.slug)
    revalidatePath('/admin/journal')
    return { ok: true }
  })
}
