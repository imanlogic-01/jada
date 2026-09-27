'use client'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">Something went wrong</span>
          <h1>This page didn’t load.</h1>
          <p>It’s usually a brief connection problem. Nothing you saved earlier has been lost.</p>
        </div>
      </header>
      <div className="notice error">
        {error.message || 'Unexpected error.'}
        {error.digest && <> · Reference {error.digest}</>}
      </div>
      <div className="btn-row">
        <button className="btn" onClick={reset}>
          Try again
        </button>
        <a className="btn ghost" href="/admin">
          Back to overview
        </a>
      </div>
    </div>
  )
}
