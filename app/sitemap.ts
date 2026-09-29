import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/content/queries'
import { SITE_URL as base } from '@/lib/site/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts()
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/journal`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/gallery`, changeFrequency: 'weekly', priority: 0.7 },
    ...posts.map((p) => ({ url: `${base}/journal/${p.slug}`, lastModified: p.published_at ?? undefined, priority: 0.6 })),
  ]
}
