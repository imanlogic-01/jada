'use client'
import { useCallback, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { deletePost, savePost } from '@/lib/actions/posts'
import { fieldErrors, type FieldErrors } from '@/lib/content/errors'
import { timeAgo } from '@/lib/content/format'
import { postSchema, slugify, type PostInput } from '@/lib/content/posts'
import { Field, SaveBar, useSaveShortcut, useUnsavedWarning, type SaveState } from './ui'
import { ImageField } from './ImageField'
import { RichTextEditor } from './RichTextEditor'
import { focusFirstError } from './SectionForm'

// <input type="datetime-local"> works in local time without a zone; the database stores UTC.
const toLocalInput = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const noop = () => () => {}

type Props = { id: string | null; initial: PostInput; updatedAt: string | null; wasPublished: boolean }

export function PostForm({ id, initial, updatedAt, wasPublished }: Props) {
  const router = useRouter()
  const [post, setPost] = useState<PostInput>(initial)
  const [saved, setSaved] = useState<PostInput>(initial)
  // The date input depends on the browser's timezone, so it only renders after hydration.
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [failure, setFailure] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState(updatedAt)
  const [live, setLive] = useState(wasPublished ? initial.slug : '')
  const dirty = JSON.stringify(post) !== JSON.stringify(saved)
  useUnsavedWarning(dirty && !deleting)

  const set = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    setPost((p) => {
      const next = { ...p, [key]: value }
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value))
      if (key === 'status' && value === 'published' && !p.publishedAt) next.publishedAt = new Date().toISOString()
      return next
    })
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== key && !k.startsWith(`${key}.`) && !(key === 'title' && k === 'slug'))))
    setFailure('')
    setJustSaved(false)
  }

  const save = useCallback(async () => {
    if (saving || (!dirty && id)) return
    const parsed = postSchema.safeParse(post)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      setFailure('Some fields need attention.')
      focusFirstError()
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const result = await savePost(id, parsed.data)
      if (!result.ok || !result.data) {
        setErrors(result.ok ? {} : (result.errors ?? {}))
        setFailure(result.ok ? 'Could not save.' : result.message)
        if (!result.ok && result.errors) focusFirstError()
        return
      }
      const clean = { ...post, slug: result.data.slug }
      setPost(clean)
      setSaved(clean)
      setErrors({})
      setJustSaved(true)
      setLastSaved(result.data.updatedAt)
      setLive(parsed.data.status === 'published' ? result.data.slug : '')
      if (!id) router.replace(`/admin/journal/${result.data.id}`)
      else router.refresh()
    } catch {
      setFailure('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }, [saving, dirty, id, post, router])
  useSaveShortcut(save)

  const remove = async () => {
    if (!id || !confirm(`Delete “${saved.title || 'this post'}”? This can’t be undone.`)) return
    setDeleting(true)
    const result = await deletePost(id).catch(() => ({ ok: false as const, message: 'Could not reach the server. Please try again.' }))
    if (!result.ok) {
      setDeleting(false)
      setFailure(result.message)
      return
    }
    router.push('/admin/journal')
    router.refresh()
  }

  const published = post.status === 'published'
  const state: SaveState = saving
    ? { status: 'saving' }
    : deleting
      ? { status: 'saving', message: 'Deleting…' }
      : failure
        ? { status: 'error', message: failure }
        : dirty || !id
          ? { status: 'dirty', message: id ? 'Unsaved changes' : 'New post, not saved yet' }
          : justSaved
            ? { status: 'saved', message: published ? 'Saved. The post is live.' : 'Draft saved. Only you can see it.' }
            : { status: 'clean', message: `${published ? 'Published' : 'Draft'} · last edited ${timeAgo(lastSaved).toLowerCase()}` }

  const seoTitle = post.seoTitle || `${post.title || 'Post title'} | JADA`
  const seoDescription = post.seoDescription || post.excerpt || 'A short summary of the post appears here in search results.'

  return (
    <>
      {failure && Object.keys(errors).length > 0 && <div className="notice error">{failure} They’re highlighted below.</div>}

      <section className="adm-card adm-stack" aria-label="Post">
        <Field label="Title" error={errors.title} count={{ value: post.title, max: 140 }}>
          {(p) => <input {...p} className="inp heading" value={post.title} onChange={(e) => set('title', e.target.value)} placeholder="Give the post a title" autoFocus={!id} />}
        </Field>
        <Field label="Web address" help={wasPublished ? 'Changing this breaks links people may have shared.' : 'Created from the title. Lowercase letters, numbers and hyphens.'} error={errors.slug}>
          {(p) => (
            <div className="inp-prefix">
              <span>/journal/</span>
              <input
                {...p}
                className="inp"
                value={post.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                }}
                onBlur={() => set('slug', slugify(post.slug))}
              />
            </div>
          )}
        </Field>
        <Field label="Excerpt" help="One or two sentences shown on the journal page and in search results." error={errors.excerpt} count={{ value: post.excerpt, max: 300 }}>
          {(p) => <textarea {...p} className="inp" rows={2} value={post.excerpt} onChange={(e) => set('excerpt', e.target.value)} />}
        </Field>
        <ImageField
          label="Cover image (optional)"
          help="Shown on the journal page and when the post is shared. Portrait or landscape both work."
          folder="journal"
          optional
          value={post.cover}
          onChange={(v) => set('cover', v)}
          errors={{ src: errors['cover.src'], alt: errors['cover.alt'] }}
        />
        <Field label="Body" error={errors.bodyHtml}>
          {(p) => <RichTextEditor id={p.id} value={post.bodyHtml} onChange={(html) => set('bodyHtml', html)} invalid={Boolean(errors.bodyHtml)} describedBy={p['aria-describedby']} />}
        </Field>
      </section>

      <section className="adm-card" aria-labelledby="publishing">
        <h2 id="publishing">Publishing</h2>
        <p>Drafts are only visible here. Published posts appear on the site straight away.</p>
        <div className="adm-row">
          <Field label="Status" error={errors.status}>
            {(p) => (
              <select {...p} className="inp" value={post.status} onChange={(e) => set('status', e.target.value as PostInput['status'])}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            )}
          </Field>
          <Field label="Publish date" help="Shown on the post. Can be set to an earlier date." error={errors.publishedAt}>
            {(p) =>
              mounted ? (
                <input
                  {...p}
                  className="inp"
                  type="datetime-local"
                  value={toLocalInput(post.publishedAt)}
                  max={toLocalInput(new Date().toISOString())}
                  onChange={(e) => set('publishedAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
              ) : (
                <div className="inp skel" style={{ height: 50 }} />
              )
            }
          </Field>
        </div>
      </section>

      <section className="adm-card adm-stack" aria-labelledby="seo">
        <div>
          <h2 id="seo" className="adm-h2" style={{ fontSize: 28, marginBottom: 6 }}>
            Search & sharing
          </h2>
          <p className="fld-help">Optional. Leave empty to use the title and excerpt.</p>
        </div>
        <Field label="SEO title" error={errors.seoTitle} count={{ value: post.seoTitle, max: 70 }}>
          {(p) => <input {...p} className="inp" value={post.seoTitle} placeholder={`${post.title || 'Post title'} | JADA`} onChange={(e) => set('seoTitle', e.target.value)} />}
        </Field>
        <Field label="SEO description" error={errors.seoDescription} count={{ value: post.seoDescription, max: 170 }}>
          {(p) => <textarea {...p} className="inp" rows={2} value={post.seoDescription} placeholder={post.excerpt} onChange={(e) => set('seoDescription', e.target.value)} />}
        </Field>
        <SearchPreview title={seoTitle} description={seoDescription} path={`/journal/${post.slug || 'post'}`} />
      </section>

      <SaveBar state={state} onSave={save} saveLabel={published ? (wasPublished ? 'Update post' : 'Publish') : 'Save draft'} viewHref={live && !dirty ? `/journal/${live}` : undefined}>
        {id && (
          <button type="button" className="btn danger" onClick={remove} disabled={saving || deleting}>
            Delete
          </button>
        )}
      </SaveBar>
    </>
  )
}

export function SearchPreview({ title, description, path }: { title: string; description: string; path: string }) {
  return (
    <div aria-label="Search result preview" style={{ border: '1px solid var(--line)', padding: '16px 18px', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ fontSize: 12, color: '#4d5156' }}>jada · {path}</div>
      <div style={{ fontSize: 19, color: '#1a0dab', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#4d5156', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</div>
    </div>
  )
}
