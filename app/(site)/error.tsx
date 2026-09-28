'use client'

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="lost">
      <div>
        <span className="section-label">Something went wrong</span>
        <h1 className="display">
          Sorry<em>.</em>
        </h1>
        <p>This page couldn’t load just now. Please try again in a moment.</p>
        <button className="rule-link btn-reset" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  )
}
