import { listGallery } from '@/lib/content/admin-queries'
import { GalleryManager } from '@/components/admin/GalleryManager'

export default async function GalleryAdminPage() {
  const items = await listGallery()
  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">Content</span>
          <h1>Gallery</h1>
          <p>Photos from projects, behind-the-scenes moments and videos. They show in the Visuals row on the homepage and on the gallery page. Changes go live straight away.</p>
        </div>
        <a className="btn ghost" href="/gallery" target="_blank" rel="noopener">
          View gallery
        </a>
      </header>
      <GalleryManager items={items} />
    </div>
  )
}
