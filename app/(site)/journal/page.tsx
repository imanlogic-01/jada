import type { Metadata } from 'next'
import { getPageSeo, getPublishedPosts, getSections } from '@/lib/content/queries'
import { Rich } from '@/lib/content/format'
import { Footer, PostCard } from '@/components/site/Sections'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('/journal')
  const images = seo.ogImage ? [{ url: seo.ogImage }] : undefined
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/journal' },
    openGraph: { title: seo.title, description: seo.description, type: 'website', url: '/journal', images },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, images },
  }
}

export default async function JournalPage() {
  const [s, posts] = await Promise.all([getSections(), getPublishedPosts()])
  return (
    <>
      <main className="jr">
        <header className="jr-head">
          <div>
            <span className="section-label">{s.journal.label}</span>
            <h1 className="display">
              <Rich text={s.journal.heading} />
            </h1>
          </div>
          <p>{s.journal.intro}</p>
        </header>
        {posts.length ? (
          <div className="jr-grid">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 30vw" />
            ))}
          </div>
        ) : (
          <p className="jr-empty">New entries are on the way.</p>
        )}
      </main>
      <Footer c={s.footer} />
    </>
  )
}
