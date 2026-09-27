import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/content/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const posts = await getPublishedPosts()
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/journal`, changeFrequency: 'weekly', priority: 0.8 },
    ...posts.map((p) => ({ url: `${base}/journal/${p.slug}`, lastModified: p.published_at ?? undefined, priority: 0.6 })),
  ]
}
