import Link from 'next/link'
import { countNewBookings, getSectionUpdates, listPosts } from '@/lib/content/admin-queries'
import { timeAgo } from '@/lib/content/format'
import { SECTION_KEYS, sectionEditors } from '@/lib/content/sections'

export default async function Overview() {
  const [updates, posts, newBookings] = await Promise.all([getSectionUpdates(), listPosts(), countNewBookings()])
  const published = posts.filter((p) => p.status === 'published').length
  const drafts = posts.length - published

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">JADA · Site editor</span>
          <h1>Welcome back.</h1>
          <p>Everything you save here goes live on the site straight away. Journal drafts stay private until you publish them.</p>
        </div>
        <a className="btn ghost" href="/" target="_blank" rel="noopener">
          View site ↗
        </a>
      </header>

      <div className="tiles">
        <Link className="tile" href="/admin/bookings">
          <span className="adm-label">Booking requests</span>
          <b>{newBookings}</b>
          <span>{newBookings === 1 ? 'new request waiting' : 'new requests waiting'}</span>
        </Link>
        <Link className="tile" href="/admin/journal">
          <span className="adm-label">Journal</span>
          <b>{published}</b>
          <span>
            published{drafts ? ` · ${drafts} draft${drafts === 1 ? '' : 's'}` : ''}
          </span>
        </Link>
        <Link className="tile" href="/admin/journal/new">
          <span className="adm-label">Quick start</span>
          <b>+</b>
          <span>Write a new journal post</span>
        </Link>
      </div>

      <h2 className="adm-h2">Homepage sections</h2>
      <div className="sec-list">
        {SECTION_KEYS.map((key) => (
          <Link key={key} href={`/admin/sections/${key}`}>
            <b>{sectionEditors[key].title}</b>
            <span>{updates[key] ? `Edited ${timeAgo(updates[key]).toLowerCase()}` : sectionEditors[key].blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
