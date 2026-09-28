import { Fragment, type ReactNode } from 'react'

/**
 * Renders editor text safely: *word* becomes gold italics (<em>) and new lines become <br>.
 * No HTML from the database is ever injected here.
 */
export function Rich({ text }: { text: string }) {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line.split(/(\*[^*\n]+\*)/g).map((part, j): ReactNode =>
        part.length > 2 && part.startsWith('*') && part.endsWith('*') ? <em key={j}>{part.slice(1, -1)}</em> : part,
      )}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ))
}

/** Plain-text version for alt text, metadata and titles. */
export const plain = (text: string) => text.replace(/\*/g, '').replace(/\s*\n\s*/g, ' ').trim()

export function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' }).format(new Date(value))
}

/** "5 minutes ago", "yesterday", then a date. */
export function timeAgo(iso: string | null) {
  if (!iso) return 'Not edited yet'
  const s = (Date.now() - Date.parse(iso)) / 1000
  const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })
  if (s < 60) return 'Just now'
  if (s < 3600) return rtf.format(-Math.floor(s / 60), 'minute')
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), 'hour')
  if (s < 86400 * 7) return rtf.format(-Math.floor(s / 86400), 'day')
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' }).format(new Date(iso))
}
