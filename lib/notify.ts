import 'server-only'
import type { BookingInput } from '@/lib/content/booking'

/** Emails the team about a new booking request when Resend is configured. Never blocks the request itself. */
export async function notifyBooking(booking: BookingInput) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.BOOKING_NOTIFY_TO
  if (!key || !to) return

  const lines = [
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Phone: ${booking.phone}` : null,
    `Booking for: ${booking.eventType}`,
    booking.eventDate ? `Date: ${booking.eventDate}` : null,
    booking.location ? `Location: ${booking.location}` : null,
    booking.budget ? `Budget: ${booking.budget}` : null,
    '',
    booking.message,
    '',
    'Manage requests at /admin/bookings',
  ].filter((line) => line !== null)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.BOOKING_NOTIFY_FROM || 'JADA Bookings <onboarding@resend.dev>',
        to: to.split(',').map((s) => s.trim()),
        reply_to: booking.email,
        subject: `Booking request: ${booking.eventType} from ${booking.name}`,
        text: lines.join('\n'),
      }),
    })
    if (!res.ok) console.error('Booking email failed', res.status, await res.text())
  } catch (error) {
    console.error('Booking email failed', error)
  }
}
