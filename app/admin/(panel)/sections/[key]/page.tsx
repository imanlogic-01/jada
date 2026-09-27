import { notFound } from 'next/navigation'
import { getSectionForEdit } from '@/lib/content/admin-queries'
import { isSectionKey, sectionEditors } from '@/lib/content/sections'
import { SectionForm } from '@/components/admin/SectionForm'

export default async function SectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!isSectionKey(key)) notFound()
  const { content, updatedAt } = await getSectionForEdit(key)
  const editor = sectionEditors[key]
  return (
    <div className="adm-page">
      <header className="adm-head">
        <div>
          <span className="adm-label">Homepage</span>
          <h1>{editor.title}</h1>
          <p>{editor.blurb}</p>
        </div>
      </header>
      {/* key resets the form state when switching between sections */}
      <SectionForm key={key} sectionKey={key} initial={content} updatedAt={updatedAt} />
    </div>
  )
}
