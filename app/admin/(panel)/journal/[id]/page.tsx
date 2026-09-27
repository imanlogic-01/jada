import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost } from '@/lib/content/admin-queries'
import { rowToInput } from '@/lib/content/posts'
import { PostForm } from '@/components/admin/PostForm'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()
  return (
    <div className="adm-page">
      <Link className="adm-back" href="/admin/journal">
        ← Journal
      </Link>
      <header className="adm-head">
        <div>
          <span className="adm-label">Journal · {post.status === 'published' ? 'Published' : 'Draft'}</span>
          <h1>Edit post</h1>
        </div>
      </header>
      <PostForm key={post.id} id={post.id} initial={rowToInput(post)} updatedAt={post.updated_at} wasPublished={post.status === 'published'} />
    </div>
  )
}
