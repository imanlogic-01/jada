import './site.css'
import { getSections } from '@/lib/content/queries'
import { SiteChrome } from '@/components/site/SiteChrome'
import { VideoProvider } from '@/components/site/Video'
import { Reveal } from '@/components/site/Reveal'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { release, footer } = await getSections()
  return (
    <VideoProvider>
      <div className="noise" />
      <SiteChrome feature={release.cover} caption={release.menuCaption} socials={footer.socials} />
      {children}
      <Reveal />
    </VideoProvider>
  )
}
