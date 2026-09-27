'use client'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addGalleryItems, deleteGalleryItem, moveGalleryItem, updateGalleryItem } from '@/lib/actions/gallery'
import { categoryLabel, GALLERY_CATEGORIES, galleryThumb, rowToGalleryInput, type GalleryCategory, type GalleryInput, type GalleryRow } from '@/lib/content/gallery'
import { IMAGE_TYPES, isVideoType, VIDEO_TYPES } from '@/lib/content/media'
import { youtubeId } from '@/lib/content/sections'
import { imageSize, uploadFile } from '@/lib/upload'
import { altFromName } from './ImageField'

type Upload = { id: number; name: string; progress: number; error?: string }
let uploadSeq = 0

export function GalleryManager({ items }: { items: GalleryRow[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<GalleryCategory>('project')
  const [uploads, setUploads] = useState<Upload[]>([])
  const [over, setOver] = useState(false)
  const [link, setLink] = useState('')
  const [linkCaption, setLinkCaption] = useState('')
  const [linkError, setLinkError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, start] = useTransition()
  const [filter, setFilter] = useState('all')

  const patch = (id: number, p: Partial<Upload>) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...p } : x)))

  const addFiles = async (list: FileList | File[]) => {
    const files = [...list].slice(0, 30)
    if (!files.length) return
    setNotice('')
    const queued = files.map((f) => ({ id: ++uploadSeq, name: f.name, progress: 0 }))
    setUploads((u) => [...u, ...queued])
    let added = 0
    // One at a time keeps big videos from competing for bandwidth, and keeps the order.
    for (const [i, file] of files.entries()) {
      const { id } = queued[i]
      const video = isVideoType(file.type)
      const size = video ? null : await imageSize(file)
      const result = await uploadFile(file, 'gallery', 'any', (p) => patch(id, { progress: p }))
      if ('error' in result) {
        patch(id, { error: result.error })
        continue
      }
      const item: GalleryInput = {
        kind: video ? 'video' : 'image',
        category,
        image: video ? '' : result.url,
        videoUrl: video ? result.url : '',
        youtubeId: '',
        caption: '',
        alt: video ? '' : altFromName(file.name),
        width: size?.width ?? null,
        height: size?.height ?? null,
      }
      const saved = await addGalleryItems([item]).catch(() => ({ ok: false as const, message: 'Could not reach the server.' }))
      if (!saved.ok) patch(id, { error: saved.message })
      else {
        added++
        setUploads((u) => u.filter((x) => x.id !== id))
      }
    }
    if (added) {
      setNotice(`${added} ${added === 1 ? 'item' : 'items'} added and live.`)
      router.refresh()
    }
  }

  const addLink = () =>
    start(async () => {
      const id = youtubeId(link)
      if (!/^[\w-]{11}$/.test(id)) return setLinkError('Paste a YouTube link, for example https://youtu.be/…')
      const result = await addGalleryItems([
        { kind: 'video', category, image: '', videoUrl: '', youtubeId: id, caption: linkCaption, alt: '', width: 1280, height: 720 },
      ]).catch(() => ({ ok: false as const, message: 'Could not reach the server.' }))
      if (!result.ok) return setLinkError(result.message)
      setLink('')
      setLinkCaption('')
      setLinkError('')
      setNotice('Video added and live.')
      router.refresh()
    })

  const counts = {
    all: items.length,
    project: items.filter((i) => i.category === 'project').length,
    'behind-the-scenes': items.filter((i) => i.category === 'behind-the-scenes').length,
    video: items.filter((i) => i.kind === 'video').length,
  }
  const shown = items.filter((i) => filter === 'all' || (filter === 'video' ? i.kind === 'video' : i.category === filter))

  return (
    <>
      <section className="adm-card adm-stack">
        <div
          className={`gal-drop${over ? ' over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            addFiles(e.dataTransfer.files)
          }}
        >
          <b>Drop photos or videos here</b>
          <span>or click to choose several at once · photos up to 8 MB, MP4 videos up to 50 MB</span>
        </div>
        <div className="adm-row">
          <label className="fld">
            <span className="fld-name">Add new items to</span>
            <select className="inp" value={category} onChange={(e) => setCategory(e.target.value as GalleryCategory)}>
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="fld">
            <span className="fld-name">Or add a YouTube video</span>
            <div className="inp-prefix gal-link">
              <input className="inp" placeholder="https://youtu.be/…" value={link} onChange={(e) => (setLink(e.target.value), setLinkError(''))} aria-invalid={linkError ? true : undefined} aria-label="YouTube link" />
              <input className="inp" placeholder="Caption (optional)" value={linkCaption} onChange={(e) => setLinkCaption(e.target.value)} maxLength={140} aria-label="Caption" />
              <button type="button" className="btn" onClick={addLink} disabled={pending || !link.trim()}>
                Add
              </button>
            </div>
            {linkError && (
              <p className="fld-error" role="alert">
                {linkError}
              </p>
            )}
          </div>
        </div>
        {uploads.length > 0 && (
          <ul className="gal-uploads" aria-live="polite">
            {uploads.map((u) => (
              <li key={u.id} className={u.error ? 'failed' : ''}>
                <span>{u.name}</span>
                {u.error ? (
                  <>
                    <em>{u.error}</em>
                    <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>
                      ✕
                    </button>
                  </>
                ) : (
                  <i style={{ '--p': u.progress } as React.CSSProperties}>{Math.round(u.progress * 100)}%</i>
                )}
              </li>
            ))}
          </ul>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        <input ref={inputRef} type="file" multiple hidden accept={[...Object.keys(IMAGE_TYPES), ...Object.keys(VIDEO_TYPES)].join(',')} onChange={(e) => (addFiles(e.target.files ?? []), (e.target.value = ''))} />
      </section>

      <nav className="tabs" aria-label="Filter">
        {(['all', 'project', 'behind-the-scenes', 'video'] as const).map((f) => (
          <a
            key={f}
            href="#"
            aria-current={filter === f ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              setFilter(f)
            }}
          >
            {f === 'all' ? 'All' : f === 'video' ? 'Videos' : categoryLabel(f)} ({counts[f]})
          </a>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="empty">
          <h2>Nothing here yet</h2>
          <p>Drop photos or videos above to add them. They appear on the site straight away.</p>
        </div>
      ) : (
        <div className="gal-grid">
          {shown.map((item) => (
            <ItemCard key={item.id} item={item} first={item.id === items[0].id} last={item.id === items[items.length - 1].id} onChanged={() => router.refresh()} />
          ))}
        </div>
      )}
    </>
  )
}

function ItemCard({ item, first, last, onChanged }: { item: GalleryRow; first: boolean; last: boolean; onChanged: () => void }) {
  const [caption, setCaption] = useState(item.caption)
  const [alt, setAlt] = useState(item.alt)
  const [status, setStatus] = useState<'' | 'saving' | 'saved' | string>('')
  const [busy, start] = useTransition()
  const thumb = galleryThumb(item)

  const save = (changes: Partial<GalleryInput>) =>
    start(async () => {
      setStatus('saving')
      const result = await updateGalleryItem(item.id, { ...rowToGalleryInput(item), caption, alt, ...changes }).catch(() => ({ ok: false as const, message: 'Could not reach the server.' }))
      if (!result.ok) return setStatus(result.message)
      setStatus('saved')
      onChanged()
    })
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const result = await fn().catch(() => ({ ok: false, message: 'Could not reach the server.' }))
      if (!result.ok) return setStatus(result.message ?? 'Something went wrong.')
      onChanged()
    })
  const dirty = caption !== item.caption || alt !== item.alt

  return (
    <article className={`gal-item${busy ? ' busy' : ''}`}>
      <div className="gal-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
        {thumb ? <img src={thumb} alt="" /> : item.video_url && <video src={item.video_url} muted playsInline preload="metadata" />}
        {item.kind === 'video' && <span className="gal-badge">{item.youtube_id ? 'YouTube' : 'Video'}</span>}
      </div>
      <div className="gal-body">
        <input
          className="inp"
          placeholder="Caption (optional)"
          aria-label="Caption"
          maxLength={140}
          value={caption}
          onChange={(e) => (setCaption(e.target.value), setStatus(''))}
          onBlur={() => dirty && save({})}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
        />
        {item.kind === 'image' && (
          <input
            className="inp sm"
            placeholder="Image description for screen readers"
            aria-label="Image description"
            maxLength={160}
            value={alt}
            onChange={(e) => (setAlt(e.target.value), setStatus(''))}
            onBlur={() => dirty && save({})}
          />
        )}
        <div className="gal-actions">
          <select className="inp sm" aria-label="Category" value={item.category} onChange={(e) => save({ category: e.target.value as GalleryCategory })} disabled={busy}>
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" aria-label="Move earlier" disabled={first || busy} onClick={() => run(() => moveGalleryItem(item.id, -1))}>
            ←
          </button>
          <button type="button" className="icon-btn" aria-label="Move later" disabled={last || busy} onClick={() => run(() => moveGalleryItem(item.id, 1))}>
            →
          </button>
          <button type="button" className="icon-btn" aria-label="Delete" disabled={busy} onClick={() => confirm('Remove this from the gallery?') && run(() => deleteGalleryItem(item.id))}>
            ✕
          </button>
        </div>
        <p className={`gal-status${status && status !== 'saving' && status !== 'saved' ? ' err' : ''}`} role="status">
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved · live' : status}
        </p>
      </div>
    </article>
  )
}
