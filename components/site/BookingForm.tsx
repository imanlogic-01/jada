'use client'
import { useActionState, useEffect, useRef } from 'react'
import { submitBooking, type BookingFormState } from '@/lib/actions/bookings'
import { BUDGETS, EVENT_TYPES } from '@/lib/content/booking'

const initial: BookingFormState = { status: 'idle', key: 0 }

export function BookingForm({ successMessage, email }: { successMessage: string; email: string }) {
  const [state, action, pending] = useActionState(submitBooking, initial)
  const formRef = useRef<HTMLFormElement>(null)

  // Set in the browser (the page is static): when the visitor started, and the earliest selectable date.
  useEffect(() => {
    const form = formRef.current
    if (!form) return
    ;(form.elements.namedItem('startedAt') as HTMLInputElement).value = String(Date.now())
    ;(form.elements.namedItem('eventDate') as HTMLInputElement).min = new Date().toISOString().slice(0, 10)
  }, [state.key])
  const errors = state.errors ?? {}
  const values = state.values ?? {}

  if (state.status === 'success')
    return (
      <p className="book-success" role="status">
        {successMessage}
        <small>Request received</small>
      </p>
    )

  const field = (name: string) => ({
    id: `book-${name}`,
    name,
    defaultValue: values[name] ?? '',
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `book-${name}-error` : undefined,
  })
  const error = (name: string) => errors[name] && <span className="bf-error" id={`book-${name}-error`}>{errors[name]}</span>

  return (
    // key remounts the form after each attempt so the returned values repopulate the fields.
    <form action={action} key={state.key} ref={formRef} noValidate>
      <div className="book-grid">
        <div className="bf">
          <label htmlFor="book-name">Name</label>
          <input {...field('name')} autoComplete="name" required maxLength={100} />
          {error('name')}
        </div>
        <div className="bf">
          <label htmlFor="book-email">Email</label>
          <input {...field('email')} type="email" autoComplete="email" required maxLength={200} />
          {error('email')}
        </div>
        <div className="bf">
          <label htmlFor="book-eventType">Booking for</label>
          <select {...field('eventType')} required>
            <option value="" disabled>
              Choose one
            </option>
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {error('eventType')}
        </div>
        <div className="bf">
          <label htmlFor="book-eventDate">
            Date <i>(if known)</i>
          </label>
          <input {...field('eventDate')} type="date" />
          {error('eventDate')}
        </div>
        <div className="bf">
          <label htmlFor="book-location">
            Location <i>(optional)</i>
          </label>
          <input {...field('location')} autoComplete="address-level2" maxLength={120} />
          {error('location')}
        </div>
        <div className="bf">
          <label htmlFor="book-budget">
            Budget <i>(optional)</i>
          </label>
          <select {...field('budget')}>
            <option value="">Prefer not to say</option>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          {error('budget')}
        </div>
        <div className="bf">
          <label htmlFor="book-phone">
            Phone <i>(optional)</i>
          </label>
          <input {...field('phone')} type="tel" autoComplete="tel" maxLength={40} />
          {error('phone')}
        </div>
        <div className="bf full">
          <label htmlFor="book-message">Tell us about it</label>
          <textarea {...field('message')} required maxLength={2000} rows={3} placeholder="The occasion, audience size, set length, anything else useful." />
          {error('message')}
        </div>
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="book-company">Company</label>
        <input id="book-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="startedAt" defaultValue="" />
      <div className="book-submit">
        <button className="btn-pill" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send request'}
        </button>
        {state.status === 'error' && state.message && (
          <p className="form-error" role="alert">
            {state.message}
          </p>
        )}
      </div>
      {email && (
        <p className="book-alt">
          Prefer email? <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}
    </form>
  )
}
