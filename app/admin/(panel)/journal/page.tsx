import Link from 'next/link'
import { listPosts } from '@/lib/content/admin-queries'
import { formatDate, timeAgo } from '@/lib/content/format'
import { RowLink } from '@/components/admin/RowLink'

export default async function JournalAdminPage() {
  const posts = await listPosts()
  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">Content</span>
          <h1>Journal</h1>
          <p>Write news, studio notes and stories. Published posts appear on the journal page and in the homepage panel.</p>
        </div>
        <Link className="btn" href="/admin/journal/new">
          + New post
        </Link>
      </header>
      {posts.length === 0 ? (
        <div className="empty">
          <h2>No posts yet</h2>
          <p>Your first journal entry will also switch on the Journal panel on the homepage.</p>
          <Link className="btn" href="/admin/journal/new">
            Write the first post
          </Link>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Post</th>
              <th>Status</th>
              <th className="hide-sm">Last edited</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <RowLink key={post.id} href={`/admin/journal/${post.id}`}>
                <td>
                  <Link className="t-title" href={`/admin/journal/${post.id}`}>
                    {post.title}
                  </Link>
                  <div className="t-sub">{post.status === 'published' ? `Published ${formatDate(post.published_at)}` : `/journal/${post.slug}`}</div>
                </td>
                <td>
                  <span className={`pill ${post.status}`}>{post.status}</span>
                </td>
                <td className="t-muted hide-sm">{timeAgo(post.updated_at)}</td>
              </RowLink>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
