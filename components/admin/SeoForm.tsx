'use client'
import { useCallback, useState } from 'react'
import { saveSeo } from '@/lib/actions/seo'
import { fieldErrors, type FieldErrors } from '@/lib/content/errors'
import { timeAgo } from '@/lib/content/format'
import { seoSchema, type SeoInput, type SeoPath } from '@/lib/content/seo'
import { Field, SaveBar, useSaveShortcut, useUnsavedWarning, type SaveState } from './ui'
import { ImageField } from './ImageField'
import { SearchPreview } from './PostForm'
import { focusFirstError } from './SectionForm'

type Pages = Record<SeoPath, SeoInput & { updatedAt: string | null }>
const LABELS: Record<SeoPath, string> = { '/': 'Homepage', '/journal': 'Journal page', '/gallery': 'Gallery page' }

/** Both pages' SEO settings on one screen, saved together. */
export function SeoForm({ initial }: { initial: Pages }) {
  const strip = (p: Pages) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { title: v.title, description: v.description, ogImage: v.ogImage }])) as Record<SeoPath, SeoInput>
  const [value, setValue] = useState(() => strip(initial))
  const [saved, setSaved] = useState(() => strip(initial))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const paths = Object.keys(value) as SeoPath[]
  const changed = paths.filter((p) => JSON.stringify(value[p]) !== JSON.stringify(saved[p]))
  const dirty = changed.length > 0
  useUnsavedWarning(dirty)

  const set = (path: SeoPath, key: keyof SeoInput, v: string) => {
    setValue((all) => ({ ...all, [path]: { ...all[path], [key]: v } }))
    setErrors((e) => {
      const next = { ...e }
      delete next[`${path}.${key}`]
      return next
    })
    setFailure('')
    setJustSaved(false)
  }

  const save = useCallback(async () => {
    if (saving || !dirty) return
    const errs: FieldErrors = {}
    for (const path of changed) {
      const parsed = seoSchema.safeParse(value[path])
      if (!parsed.success) for (const [k, m] of Object.entries(fieldErrors(parsed.error))) errs[`${path}.${k}`] = m
    }
    if (Object.keys(errs).length) {
      setErrors(errs)
      setFailure('Some fields need attention.')
      focusFirstError()
      return
    }
    setSaving(true)
    try {
      for (const path of changed) {
        const result = await saveSeo(path, value[path])
        if (!result.ok) {
          setErrors(Object.fromEntries(Object.entries(result.errors ?? {}).map(([k, m]) => [`${path}.${k}`, m])))
          setFailure(result.message)
          return
        }
        setSaved((s) => ({ ...s, [path]: value[path] }))
      }
      setJustSaved(true)
    } catch {
      setFailure('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }, [saving, dirty, changed, value])
  useSaveShortcut(save)

  const state: SaveState = saving
    ? { status: 'saving' }
    : failure
      ? { status: 'error', message: failure }
      : dirty
        ? { status: 'dirty' }
        : justSaved
          ? { status: 'saved', message: 'Saved. Search engines pick this up on their next visit.' }
          : { status: 'clean' }

  return (
    <>
      {paths.map((path) => {
        const v = value[path]
        const e = (k: string) => errors[`${path}.${k}`]
        return (
          <section className="adm-card adm-stack" key={path} aria-labelledby={`seo-${path}`}>
            <div>
              <h2 id={`seo-${path}`} className="adm-h2" style={{ fontSize: 28, marginBottom: 6 }}>
                {LABELS[path]}
              </h2>
              <p className="fld-help">
                {path} · last edited {timeAgo(initial[path].updatedAt).toLowerCase()}
              </p>
            </div>
            <Field label="Page title" help="Shown in the browser tab and as the headline in search results." error={e('title')} count={{ value: v.title, max: 70 }}>
              {(p) => <input {...p} className="inp" value={v.title} onChange={(ev) => set(path, 'title', ev.target.value)} />}
            </Field>
            <Field label="Description" help="The summary under the headline in search results." error={e('description')} count={{ value: v.description, max: 170 }}>
              {(p) => <textarea {...p} className="inp" rows={3} value={v.description} onChange={(ev) => set(path, 'description', ev.target.value)} />}
            </Field>
            <SearchPreview title={v.title} description={v.description} path={path} />
            <ImageField
              label="Share image"
              help="Shown when the page is shared on WhatsApp, Instagram DMs, X and so on. Landscape, ideally 1200 × 630px."
              folder="seo"
              optional
              withAlt={false}
              value={{ src: v.ogImage, alt: '' }}
              onChange={(img) => set(path, 'ogImage', img.src)}
              errors={{ src: e('ogImage') }}
            />
          </section>
        )
      })}
      <SaveBar state={state} onSave={save} onDiscard={() => (setValue(saved), setErrors({}), setFailure(''))} saveLabel="Save" />
    </>
  )
}
