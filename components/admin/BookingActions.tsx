'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBooking, setBookingStatus } from '@/lib/actions/bookings'
import type { BookingStatus } from '@/lib/content/booking'

export function BookingActions({ id, status, email, subject }: { id: string; status: BookingStatus; email: string; subject: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, after?: () => void) =>
    start(async () => {
      setError('')
      const result = await fn().catch(() => ({ ok: false, message: 'Could not reach the server. Please try again.' }))
      if (!result.ok) return setError(result.message ?? 'Something went wrong.')
      after?.()
      router.refresh()
    })

  return (
    <div className="adm-stack" style={{ gap: 12 }}>
      <div className="btn-row">
        <a
          className="btn gold"
          href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`}
          onClick={() => status === 'new' && run(() => setBookingStatus(id, 'replied'))}
        >
          Reply by email
        </a>
        {status !== 'replied' && (
          <button className="btn ghost" disabled={pending} onClick={() => run(() => setBookingStatus(id, 'replied'))}>
            Mark as replied
          </button>
        )}
        {status !== 'new' && (
          <button className="btn ghost" disabled={pending} onClick={() => run(() => setBookingStatus(id, 'new'))}>
            Mark as new
          </button>
        )}
        {status !== 'archived' && (
          <button className="btn ghost" disabled={pending} onClick={() => run(() => setBookingStatus(id, 'archived'))}>
            Archive
          </button>
        )}
        <button
          className="btn danger"
          disabled={pending}
          onClick={() => confirm('Delete this booking request? This can’t be undone.') && run(() => deleteBooking(id), () => router.push('/admin/bookings'))}
        >
          Delete
        </button>
        {pending && <span className="spin" aria-label="Working" />}
      </div>
      {error && (
        <p className="fld-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
