import { getSeoForEdit } from '@/lib/content/admin-queries'
import { SeoForm } from '@/components/admin/SeoForm'

export default async function SeoPage() {
  const pages = await getSeoForEdit()
  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">Settings</span>
          <h1>SEO & sharing</h1>
          <p>How the site appears in Google and when links are shared. Each journal post has its own settings in the post editor.</p>
        </div>
      </header>
      <SeoForm initial={pages} />
    </div>
  )
}
