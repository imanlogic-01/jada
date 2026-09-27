import type { Metadata } from 'next'
import { getGallery, getPageSeo, getSections } from '@/lib/content/queries'
import { Rich } from '@/lib/content/format'
import { Footer } from '@/components/site/Sections'
import { GalleryGrid } from '@/components/site/Gallery'

export const dynamic = 'force-static'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('/gallery')
  const images = seo.ogImage ? [{ url: seo.ogImage }] : undefined
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: '/gallery' },
    openGraph: { title: seo.title, description: seo.description, type: 'website', url: '/gallery', images },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description, images },
  }
}

export default async function GalleryPage() {
  const [s, items] = await Promise.all([getSections(), getGallery()])
  return (
    <>
      <main className="jr">
        <header className="jr-head">
          <div>
            <span className="section-label">{s.visuals.label}</span>
            <h1 className="display">
              <Rich text="Gallery*.*" />
            </h1>
          </div>
          <p>Photos from the projects, moments from behind the scenes, and films.</p>
        </header>
        <GalleryGrid items={items} />
      </main>
      <Footer c={s.footer} />
    </>
  )
}
