import type { Metadata } from 'next'
import { getPageSeo, getPublishedPosts, getSections } from '@/lib/content/queries'
import { PRE_PAINT } from '@/lib/site/constants'
import { HorizontalScroll } from '@/components/site/HorizontalScroll'
import { Intro } from '@/components/site/Intro'
import { About, Album, Booking, Footer, Hero, Join, JournalPanel, Press, Release, Ticker, Visuals } from '@/components/site/Sections'

// Static, and regenerated on demand whenever the admin saves (revalidatePath).
export const dynamic = 'force-static'

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
  const [s, posts] = await Promise.all([getSections(), getPublishedPosts(3)])
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      <Intro />
      <HorizontalScroll>
        <main>
          <Hero c={s.hero} />
          <Ticker c={s.ticker} />
          <About c={s.about} />
          <Release c={s.release} />
          <Album c={s.album} />
          <Visuals c={s.visuals} />
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
