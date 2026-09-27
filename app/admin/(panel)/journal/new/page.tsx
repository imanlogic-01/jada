import Link from 'next/link'
import { emptyPost } from '@/lib/content/posts'
import { PostForm } from '@/components/admin/PostForm'

export default function NewPostPage() {
  return (
    <div className="adm-page">
      <Link className="adm-back" href="/admin/journal">
        ← Journal
      </Link>
      <header className="adm-head">
        <div>
          <span className="adm-label">Journal</span>
          <h1>New post</h1>
        </div>
      </header>
      <PostForm id={null} initial={emptyPost} updatedAt={null} wasPublished={false} />
    </div>
  )
}
