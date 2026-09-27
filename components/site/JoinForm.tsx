'use client'
import { useState } from 'react'

// The "action" URL of JADA's Brevo subscription form (Brevo → Contacts → Forms → Share → Embed HTML).
const BREVO_FORM_ACTION = process.env.NEXT_PUBLIC_BREVO_FORM_ACTION ?? ''

/** Mailing list sign-up. Sends to Brevo in the background and confirms on the page. */
export function JoinForm({ note, successMessage }: { note: string; successMessage: string }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  return (
    <form
      className="form"
      data-reveal
      onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const email = (form.elements.namedItem('EMAIL') as HTMLInputElement).value.trim()
        if (!BREVO_FORM_ACTION) {
          // Preview mode until the Brevo form URL is set in the environment.
          setMessage(successMessage)
          form.reset()
          return
        }
        setSending(true)
        setMessage('Joining…')
        const body = new FormData()
        body.append('EMAIL', email)
        body.append('email_address_check', '') // Brevo's own spam trap field, must stay empty
        body.append('locale', 'en')
        try {
          // Brevo doesn't allow reading the response cross-site, so a sent request counts as success.
          await fetch(BREVO_FORM_ACTION, { method: 'POST', mode: 'no-cors', body })
          setMessage(successMessage)
          form.reset()
        } catch {
          setMessage('Sorry, that didn’t go through. Please try again.')
        } finally {
          setSending(false)
        }
      }}
    >
      <div className="field">
        <input type="email" name="EMAIL" placeholder="Your email address" autoComplete="email" required aria-label="Email address" />
        <button type="submit" aria-label="Join mailing list" disabled={sending}>
          ↗
        </button>
      </div>
      {note && <div className="form-note">{note}</div>}
      <div className="form-state" aria-live="polite">
        {message}
      </div>
    </form>
  )
}
