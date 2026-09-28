import Link from 'next/link'
import { listBookings } from '@/lib/content/admin-queries'
import { BOOKING_STATUSES, type BookingStatus } from '@/lib/content/booking'
import { formatDate, timeAgo } from '@/lib/content/format'
import { RowLink } from '@/components/admin/RowLink'

const TABS: { label: string; status?: BookingStatus }[] = [{ label: 'New', status: 'new' }, { label: 'Replied', status: 'replied' }, { label: 'Archived', status: 'archived' }, { label: 'All' }]

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams
  const status = raw === 'all' ? undefined : (BOOKING_STATUSES.find((s) => s === raw) ?? 'new')
  const bookings = await listBookings(status)

  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">Inbox</span>
          <h1>Booking requests</h1>
          <p>Requests sent through the Book JADA form. Reply by email, then mark them as replied or archive them.</p>
        </div>
      </header>
      <nav className="tabs" aria-label="Filter requests">
        {TABS.map((t) => (
          <Link key={t.label} href={`/admin/bookings?status=${t.status ?? 'all'}`} aria-current={t.status === status ? 'page' : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
      {bookings.length === 0 ? (
        <div className="empty">
          <h2>{status === 'new' ? 'You’re all caught up' : 'Nothing here'}</h2>
          <p>{status === 'new' ? 'New booking requests will appear here.' : 'No requests with this status.'}</p>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>From</th>
              <th className="hide-sm">For</th>
              <th className="hide-sm">Event date</th>
              <th>Received</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <RowLink key={b.id} href={`/admin/bookings/${b.id}`}>
                <td>
                  <Link href={`/admin/bookings/${b.id}`} style={{ fontWeight: b.status === 'new' ? 600 : 400 }}>
                    {b.name}
                  </Link>
                  <div className="t-sub">{b.email}</div>
                </td>
                <td className="hide-sm">{b.event_type}</td>
                <td className="t-muted hide-sm">{b.event_date ? formatDate(b.event_date) : '—'}</td>
                <td className="t-muted">
                  {status ? timeAgo(b.created_at) : <span className={`pill ${b.status}`}>{b.status}</span>}
                </td>
              </RowLink>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
