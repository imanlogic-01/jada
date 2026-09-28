import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBooking } from '@/lib/content/admin-queries'
import { formatDate } from '@/lib/content/format'
import { BookingActions } from '@/components/admin/BookingActions'

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await getBooking(id)
  if (!b) notFound()
  const received = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' }).format(new Date(b.created_at))
  const rows: [string, React.ReactNode][] = [
    ['Email', <a key="e" href={`mailto:${b.email}`} style={{ borderBottom: '1px solid var(--gold)' }}>{b.email}</a>],
    ['Phone', b.phone ? <a key="p" href={`tel:${b.phone.replace(/\s+/g, '')}`}>{b.phone}</a> : '—'],
    ['Booking for', b.event_type],
    ['Event date', b.event_date ? formatDate(b.event_date) : 'Not given'],
    ['Location', b.location || 'Not given'],
    ['Budget', b.budget || 'Not given'],
    ['Received', received],
  ]
  return (
    <div className="adm-page">
      <Link className="adm-back" href="/admin/bookings">
        ← Booking requests
      </Link>
      <header className="adm-head">
        <div>
          <span className="adm-label">
            <span className={`pill ${b.status}`}>{b.status}</span>
          </span>
          <h1>{b.name}</h1>
        </div>
      </header>
      <section className="adm-card">
        <dl className="dl">
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="adm-card">
        <h2>Message</h2>
        <p className="msg">{b.message}</p>
      </section>
      <BookingActions id={b.id} status={b.status} email={b.email} subject={`Booking request: ${b.event_type}`} />
    </div>
  )
}
