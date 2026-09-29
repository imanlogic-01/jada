import type { LiveEvent } from './sections'

// Shows are dated in London time, wherever the visitor or the server happens to be.
const ZONE = 'Europe/London'

/** Today's date in London as YYYY-MM-DD. */
export function londonToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** A show stays listed until the end of its day. */
export const isPast = (date: string, now = new Date()) => date < londonToday(now)

/** Upcoming shows, soonest first. */
export function upcomingEvents(events: LiveEvent[], now = new Date()) {
  return events.filter((e) => !isPast(e.date, now)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

/** Parts of a YYYY-MM-DD date for display. It is read as a calendar date, so no time zone can shift it. */
export function eventDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`)
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(d)
  return {
    day: part({ day: 'numeric' }),
    month: part({ month: 'short' }),
    weekday: part({ weekday: 'short' }),
    full: part({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

/** "20:00" → "8pm", "19:30" → "7.30pm". */
export function eventTime(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}${m ? `.${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`
}

/** London's offset from UTC on that date, e.g. "+01:00" in summer. */
function londonOffset(date: string) {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName')?.value
  const offset = name?.replace('GMT', '') ?? ''
  return offset || '+00:00'
}

/** schema.org MusicEvent data so search engines can show the dates. */
export function eventJsonLd(events: LiveEvent[], poster: string, siteUrl: string) {
  return events.map((e) => {
    const price = /free/i.test(e.price) ? '0' : e.price.match(/\d+(?:\.\d+)?/)?.[0]
    return {
      '@context': 'https://schema.org',
      '@type': 'MusicEvent',
      name: e.title,
      startDate: e.time ? `${e.date}T${e.time}:00${londonOffset(e.date)}` : e.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: e.venue,
        address: { '@type': 'PostalAddress', addressLocality: e.city || undefined, addressCountry: 'GB' },
      },
      performer: { '@type': 'Person', name: 'JADA' },
      image: poster ? new URL(poster, siteUrl).toString() : undefined,
      description: e.note || undefined,
      offers: e.ticketUrl ? { '@type': 'Offer', url: e.ticketUrl, price, priceCurrency: price ? 'GBP' : undefined } : undefined,
    }
  })
}
