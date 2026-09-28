import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="adm-page">
      <div className="empty">
        <h2>Not found</h2>
        <p>This item doesn’t exist. It may have been deleted.</p>
        <Link className="btn" href="/admin">
          Back to overview
        </Link>
      </div>
    </div>
  )
}
