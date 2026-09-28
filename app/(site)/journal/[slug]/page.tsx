import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedPost, getPublishedPosts, getSections } from '@/lib/content/queries'
import { formatDate } from '@/lib/content/format'
import { Footer } from '@/components/site/Sections'
import { Img } from '@/components/site/Img'

type Props = { params: Promise<{ slug: string }> }

// Published posts are built ahead of time; new ones are rendered on first visit and cached until the next save.
export const dynamicParams = true
export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost((await params).slug)
  if (!post) return { title: 'Not found | JADA' }
  const title = post.seo_title || `${post.title} | JADA`
  const description = post.seo_description || post.excerpt || undefined
  const images = post.cover_image ? [{ url: post.cover_image, alt: post.cover_alt }] : undefined
  const url = `/journal/${post.slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'article', url, publishedTime: post.published_at ?? undefined, images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function PostPage({ params }: Props) {
  const [post, s] = await Promise.all([getPublishedPost((await params).slug), getSections()])
  if (!post) notFound()
  return (
    <>
      <article className="post">
        <header className="post-head">
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          <h1>{post.title}</h1>
          {post.excerpt && <p>{post.excerpt}</p>}
        </header>
        {post.cover_image && (
          <div className="post-cover">
            <Img image={{ src: post.cover_image, alt: post.cover_alt }} sizes="(max-width:1200px) 100vw, 1200px" width={1600} height={1000} priority />
          </div>
        )}
        {/* body_html is sanitised with an allow-list when saved (lib/content/sanitize.ts). */}
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.body_html }} />
        <div className="post-foot">
          <Link className="rule-link" href="/journal">
            All journal entries
          </Link>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the homepage handles #section links itself */}
          <a className="rule-link" href="/#book">
            Book JADA
          </a>
        </div>
      </article>
      <Footer c={s.footer} />
    </>
  )
}
