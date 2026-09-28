import Link from 'next/link'
import { Rich, plain, formatDate } from '@/lib/content/format'
import type { SectionContent } from '@/lib/content/sections'
import type { PostSummary } from '@/lib/content/queries'
import { Img, LOGO } from './Img'
import { HeroImage } from './HeroImage'
import { GalleryStrip } from './Gallery'
import { VideoButton } from './Video'
import type { GalleryRow } from '@/lib/content/gallery'
import { BookingForm } from './BookingForm'
import { JoinForm } from './JoinForm'

const ext = { target: '_blank', rel: 'noopener' } as const

export function Hero({ c }: { c: SectionContent<'hero'> }) {
  return (
    <section className="hero" id="home" data-panel="Home">
      <HeroImage image={c.image} />
      <div className="scroll-mark">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}

export function Ticker({ c }: { c: SectionContent<'ticker'> }) {
  return (
    <section className="ticker" aria-label="Current release">
      <div className="ticker-track">
        {Array.from({ length: 6 }, (_, i) => (
          <a key={i} href={c.url} {...ext} aria-hidden={i > 0 || undefined} tabIndex={i > 0 ? -1 : undefined}>
            {c.text} <span>{c.tag}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export function About({ c }: { c: SectionContent<'about'> }) {
  return (
    <section className="statement" id="about" data-panel="About">
      <div className="statement-copy" data-reveal>
        <div>
          <span className="section-label">{c.label}</span>
          <h2 className="display">
            <Rich text={c.heading} />
          </h2>
          <p>{c.body}</p>
        </div>
        <a className="rule-link" href="#press">
          {c.linkLabel}
        </a>
      </div>
      <div className="statement-photo" data-reveal data-parallax>
        <Img image={c.image} sizes="(max-width:900px) 100vw, 55vw" />
      </div>
    </section>
  )
}

export function Release({ c }: { c: SectionContent<'release'> }) {
  return (
    <section className="single" id="music" data-panel="Music">
      <div className="single-head" data-reveal>
        <span className="section-label" style={{ color: 'rgba(247,244,237,.5)' }}>
          {c.label}
        </span>
        <h2 className="display">
          <Rich text={c.heading} />
        </h2>
      </div>
      <div className="single-grid">
        <div className="cover-wrap" data-reveal>
          <Img className="cover" image={c.cover} sizes="(max-width:900px) 100vw, 45vw" width={1200} height={1200} />
          <Img className="single-logo" image={c.titleArt} sizes="(max-width:900px) 84vw, 38vw" width={1200} height={400} />
        </div>
        <div className="single-copy" data-reveal>
          <h3>
            <Rich text={c.title} />
          </h3>
          <p>{c.body}</p>
          <div className="actions">
            <a className="rule-link" href={c.listenUrl} {...ext}>
              {c.listenLabel}
            </a>
            {c.videoId && (
              <VideoButton id={c.videoId} className="rule-link btn-reset">
                {c.videoLabel}
              </VideoButton>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Album({ c }: { c: SectionContent<'album'> }) {
  return (
    <section className="album" id="album" data-panel={plain(c.title).replace(/[.!]+$/, '')}>
      <div className="album-top">
        <div className="album-title" data-reveal>
          <span className="section-label">{c.label}</span>
          <h2 className="display">
            <Rich text={c.title} />
          </h2>
          <p>{c.body}</p>
          <a className="rule-link" href={c.linkUrl} {...ext}>
            {c.linkLabel}
          </a>
        </div>
        <div className="album-art" data-reveal>
          <Img image={c.cover} sizes="(max-width:900px) 100vw, 50vw" width={1400} height={1400} />
          <Img className="album-title-img" image={c.titleArt} sizes="(max-width:900px) 72vw, 36vw" width={1200} height={300} />
        </div>
      </div>
      <div className="album-quote" data-reveal>
        <span className="label">{c.quoteLabel}</span>
        <blockquote>
          <Rich text={c.quote} />
        </blockquote>
      </div>
    </section>
  )
}

export function Visuals({ c, items }: { c: SectionContent<'visuals'>; items: GalleryRow[] }) {
  if (!items.length) return null
  return (
    <section className="visuals" id="visuals" data-panel="Visuals">
      <div className="visuals-head" data-reveal>
        <div>
          <span className="section-label">{c.label}</span>
          <h2 className="display">
            <Rich text={c.heading} />
          </h2>
        </div>
        <span className="section-label">
          <span className="only-v">Drag / swipe</span>
          <span className="only-h">Keep scrolling</span> →
        </span>
      </div>
      <GalleryStrip items={items} linkLabel={c.linkLabel} />
    </section>
  )
}

export function PostCard({ post, sizes }: { post: PostSummary; sizes: string }) {
  return (
    <Link className="post-card" href={`/journal/${post.slug}`}>
      <div className="pc-img">
        {post.cover_image ? <Img image={{ src: post.cover_image, alt: post.cover_alt }} sizes={sizes} width={800} height={1000} /> : <span>JADA</span>}
      </div>
      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
      <h3>{post.title}</h3>
      {post.excerpt && <p>{post.excerpt}</p>}
    </Link>
  )
}

export function JournalPanel({ c, posts }: { c: SectionContent<'journal'>; posts: PostSummary[] }) {
  if (!posts.length) return null
  return (
    <section className="jpanel" id="journal" data-panel="Journal">
      <div className="jpanel-head" data-reveal>
        <div>
          <span className="section-label">{c.label}</span>
          <h2 className="display">
            <Rich text={c.heading} />
          </h2>
          <p>{c.intro}</p>
        </div>
        <Link className="rule-link" href="/journal">
          {c.linkLabel}
        </Link>
      </div>
      <div className="jpanel-list" data-reveal>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 30vw" />
        ))}
      </div>
    </section>
  )
}

export function Press({ c }: { c: SectionContent<'press'> }) {
  return (
    <section className="press" id="press" data-panel="Press">
      <div className="press-photo" data-reveal data-parallax>
        <Img image={c.image} sizes="(max-width:900px) 100vw, 40vw" width={1000} height={1220} />
      </div>
      <div className="press-copy" data-reveal>
        <div className="press-a">
          <span className="section-label">{c.label}</span>
          <h2 className="display">
            <Rich text={c.heading} />
          </h2>
          <p className="lead">{c.lead}</p>
        </div>
        <div className="press-b">
          <p>{c.body}</p>
          {c.stats.length > 0 && (
            <div className="press-grid">
              {c.stats.map((s, i) => (
                <div className="press-stat" key={i}>
                  <b>{s.title}</b>
                  <span>{s.detail}</span>
                </div>
              ))}
            </div>
          )}
          <a className="rule-link" href={c.assetsUrl} {...ext}>
            {c.assetsLabel}
          </a>
        </div>
      </div>
    </section>
  )
}

export function Booking({ c }: { c: SectionContent<'booking'> }) {
  return (
    <section className="book" id="book" data-panel="Book JADA">
      <div className="book-copy" data-reveal>
        <span className="section-label">{c.label}</span>
        <h2 className="display">
          <Rich text={c.heading} />
        </h2>
        <p className="book-intro">{c.intro}</p>
      </div>
      {c.offerings.length > 0 && (
        <div className="offerings" data-reveal>
          {c.offerings.map((o, i) => (
            <div className="offering" key={i}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{o.title}</b>
              <p>{o.detail}</p>
            </div>
          ))}
        </div>
      )}
      <div className="book-form" data-reveal>
        <BookingForm successMessage={c.successMessage} email={c.email} />
      </div>
    </section>
  )
}

export function Join({ c }: { c: SectionContent<'join'> }) {
  return (
    <section className="mail" id="join" data-panel="Join">
      <div className="mail-copy" data-reveal>
        <span className="section-label" style={{ color: 'rgba(247,244,237,.45)' }}>
          {c.label}
        </span>
        <h2 className="display">
          <Rich text={c.heading} />
        </h2>
        <p>{c.body}</p>
      </div>
      <JoinForm note={c.note} successMessage={c.successMessage} />
    </section>
  )
}

export function Footer({ c }: { c: SectionContent<'footer'> }) {
  return (
    <footer id="contact" data-panel="Contact">
      <div className="foot-top">
        <Img className="foot-logo" image={LOGO} sizes="340px" width={1011} height={247} />
        <div className="socials">
          {c.socials.map((s) => (
            <a key={s.url + s.label} href={s.url} {...ext}>
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <div className="foot-bottom">
        <span>
          © {new Date().getFullYear()} {c.copyright}
        </span>
        <span>{c.note}</span>
      </div>
    </footer>
  )
}
