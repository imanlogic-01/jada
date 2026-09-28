'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categoryLabel, galleryRatio, galleryThumb, GALLERY_CATEGORIES, type GalleryRow } from '@/lib/content/gallery'
import { Img } from './Img'
import { Play } from './Icon'

function Card({ item, onOpen, sizes, parallax }: { item: GalleryRow; onOpen: () => void; sizes: string; parallax?: boolean }) {
  const thumb = galleryThumb(item)
  const label = item.caption || item.alt || (item.kind === 'video' ? 'Video' : 'Photo')
  return (
    <button
      type="button"
      className={`g-card${item.kind === 'video' ? ' is-video' : ''}`}
      style={{ '--r': galleryRatio(item) } as React.CSSProperties}
      onClick={onOpen}
      aria-label={`${item.kind === 'video' ? 'Play' : 'View'}: ${label}`}
      {...(parallax ? { 'data-parallax': '' } : {})}
    >
      {thumb && <Img image={{ src: thumb, alt: item.alt || item.caption }} sizes={sizes} width={item.width ?? 1280} height={item.height ?? 720} />}
      <span className="g-meta">{item.kind === 'video' ? 'Video' : categoryLabel(item.category)}</span>
      {item.kind === 'video' && (
        <span className="play" aria-hidden="true">
          <Play />
        </span>
      )}
      {item.caption && <span className="g-caption">{item.caption}</span>}
    </button>
  )
}

/** Full-screen viewer for photos and videos, with arrow keys, swipe and Escape. */
function Lightbox({ items, index, setIndex }: { items: GalleryRow[]; index: number; setIndex: (i: number | null) => void }) {
  const item = items[index]
  const touch = useRef<number | null>(null)
  const count = items.length
  const go = (step: number) => setIndex((index + step + count) % count)

  useEffect(() => {
    document.body.classList.add('lock')
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null)
      if (e.key === 'ArrowRight' && count > 1) setIndex((index + 1) % count)
      if (e.key === 'ArrowLeft' && count > 1) setIndex((index - 1 + count) % count)
    }
    addEventListener('keydown', key)
    return () => {
      removeEventListener('keydown', key)
      document.body.classList.remove('lock')
    }
  }, [index, count, setIndex])

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery viewer"
      onClick={(e) => e.target === e.currentTarget && setIndex(null)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null || count < 2) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <button className="lb-close" onClick={() => setIndex(null)} autoFocus>
        Close ×
      </button>
      <figure className="lb-stage" key={item.id}>
        {item.kind === 'image' ? (
          <Img image={{ src: item.image ?? '', alt: item.alt || item.caption }} sizes="100vw" width={item.width ?? 1600} height={item.height ?? 1200} />
        ) : item.video_url ? (
          <video src={item.video_url} controls autoPlay playsInline poster={item.image ?? undefined} />
        ) : (
          <iframe src={`https://www.youtube-nocookie.com/embed/${item.youtube_id}?autoplay=1&rel=0`} title={item.caption || 'JADA video'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        )}
        {(item.caption || count > 1) && (
          <figcaption>
            <span>{item.caption}</span>
            <span>
              {categoryLabel(item.category)} · {index + 1} / {count}
            </span>
          </figcaption>
        )}
      </figure>
      {count > 1 && (
        <>
          <button className="lb-nav prev" onClick={() => go(-1)} aria-label="Previous">
            ←
          </button>
          <button className="lb-nav next" onClick={() => go(1)} aria-label="Next">
            →
          </button>
        </>
      )}
    </div>
  )
}

/** Homepage row: the first few gallery items plus a link to the full gallery. */
export function GalleryStrip({ items, linkLabel }: { items: GalleryRow[]; linkLabel: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const row = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)

  return (
    <>
      <div
        className="film-row g-row"
        ref={row}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || document.documentElement.classList.contains('h-mode')) return
          drag.current = { x: e.clientX, left: row.current!.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          if (Math.abs(e.clientX - d.x) > 6) d.moved = true
          row.current!.scrollLeft = d.left - (e.clientX - d.x)
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          // A drag shouldn't open the item it ended on.
          if (drag.current?.moved) e.stopPropagation()
        }}
      >
        {items.map((item, i) => (
          <Card key={item.id} item={item} onOpen={() => setOpen(i)} sizes="(max-width:900px) 80vw, 60vw" parallax />
        ))}
        <Link className="g-more" href="/gallery">
          <span>{linkLabel}</span>
          <i>→</i>
        </Link>
      </div>
      {open !== null && <Lightbox items={items} index={open} setIndex={setOpen} />}
    </>
  )
}

const FILTERS = [{ value: 'all', label: 'All' }, ...GALLERY_CATEGORIES, { value: 'video', label: 'Videos' }] as const

/** /gallery page: filterable grid that keeps each photo's own shape. */
export function GalleryGrid({ items }: { items: GalleryRow[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [open, setOpen] = useState<number | null>(null)
  const shown = useMemo(
    () => items.filter((i) => filter === 'all' || (filter === 'video' ? i.kind === 'video' : i.category === filter)),
    [items, filter],
  )
  const available = FILTERS.filter((f) => f.value === 'all' || items.some((i) => (f.value === 'video' ? i.kind === 'video' : i.category === f.value)))

  return (
    <>
      {available.length > 2 && (
        <nav className="g-filters" aria-label="Filter the gallery">
          {available.map((f) => (
            <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </nav>
      )}
      {shown.length ? (
        <div className="g-grid">
          {shown.map((item, i) => (
            <Card key={item.id} item={item} onOpen={() => setOpen(i)} sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 33vw" />
          ))}
        </div>
      ) : (
        <p className="jr-empty">New photos and films are on the way.</p>
      )}
      {open !== null && shown[open] && <Lightbox items={shown} index={open} setIndex={setOpen} />}
    </>
  )
}
