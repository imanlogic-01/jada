'use client'
import { useState } from 'react'

const BREVO_FORM_ACTION = process.env.NEXT_PUBLIC_BREVO_FORM_ACTION ?? ''

/** Mailing list sign-up. Posts to Brevo when its form URL is configured; otherwise shows a preview confirmation. */
export function JoinForm({ note, successMessage }: { note: string; successMessage: string }) {
  const [message, setMessage] = useState('')

  return (
    <form
      className="form"
      data-reveal
      action={BREVO_FORM_ACTION || undefined}
      method={BREVO_FORM_ACTION ? 'POST' : undefined}
      onSubmit={(e) => {
        if (BREVO_FORM_ACTION) return setMessage('Joining…')
        e.preventDefault()
        setMessage(successMessage)
        e.currentTarget.reset()
      }}
    >
      <div className="field">
        <input type="email" name="EMAIL" placeholder="Your email address" autoComplete="email" required aria-label="Email address" />
        <button type="submit" aria-label="Join mailing list">
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
