import type { Metadata } from 'next'
import { getGallery, getPageSeo, getPublishedPosts, getSections } from '@/lib/content/queries'
import { PRE_PAINT } from '@/lib/site/constants'
import { HorizontalScroll } from '@/components/site/HorizontalScroll'
import { Intro } from '@/components/site/Intro'
import { Film } from '@/components/site/Film'
import { About, Album, Booking, Footer, Hero, Join, JournalPanel, Live, Press, Release, Ticker, Visuals } from '@/components/site/Sections'

// Static, and regenerated on demand whenever the admin saves (revalidatePath).
export const dynamic = 'force-static'
// Also rebuilt hourly in the background, so shows drop off the list once their day has passed.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('/')
  const images = seo.ogImage ? [{ url: seo.ogImage }] : undefined
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/' },
    openGraph: { title: seo.title, description: seo.description, type: 'website', url: '/', images },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, images },
  }
}

export default async function HomePage() {
  const [s, posts, gallery] = await Promise.all([getSections(), getPublishedPosts(3), getGallery(12)])
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      <Intro hero={s.hero.image} />
      <HorizontalScroll>
        <main>
          <Hero c={s.hero} />
          <Film c={s.film} />
          <Ticker c={s.ticker} />
          <Live c={s.live} />
          <About c={s.about} />
          <Release c={s.release} />
          <Album c={s.album} />
          <Visuals c={s.visuals} items={gallery} />
          <JournalPanel c={s.journal} posts={posts} />
          <Press c={s.press} />
          <Booking c={s.booking} />
          <Join c={s.join} />
        </main>
        <Footer c={s.footer} />
      </HorizontalScroll>
    </>
  )
}
