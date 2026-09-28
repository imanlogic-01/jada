import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="lost">
      <div>
        <span className="section-label">Page not found</span>
        <h1 className="display">
          Lost<em>.</em>
        </h1>
        <p>This page has moved or never existed.</p>
        <Link className="rule-link" href="/">
          Back to JADA
        </Link>
      </div>
    </main>
  )
}
