'use client'
import { useCallback, useState } from 'react'
import { saveSection } from '@/lib/actions/sections'
import { fieldErrors, type FieldErrors } from '@/lib/content/errors'
import { Rich, timeAgo } from '@/lib/content/format'
import { sectionEditors, sectionSchemas, youtubeId, type FieldDef, type ImageValue, type SectionKey } from '@/lib/content/sections'
import { Field, SaveBar, useSaveShortcut, useUnsavedWarning, type SaveState } from './ui'
import { ImageField } from './ImageField'
import { eventDay, isPast } from '@/lib/content/live'

/** A show's date in the list header, flagged once it has passed. */
const listMeta = (date: string) => (/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${eventDay(date).full}${isPast(date) ? ' · past' : ''}` : '')

type Path = (string | number)[]
type Json = Record<string, unknown>

const getIn = (obj: unknown, path: Path): unknown => path.reduce<unknown>((o, k) => (o as Json | undefined)?.[k as string], obj)
function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T
  const [head, ...rest] = path
  const copy = (Array.isArray(obj) ? [...obj] : { ...(obj as Json) }) as Json
  copy[head as string] = setIn(copy[head as string], rest, value)
  return copy as T
}
const withoutErrors = (errors: FieldErrors, prefix: string) =>
  Object.fromEntries(Object.entries(errors).filter(([k]) => k !== prefix && !k.startsWith(`${prefix}.`)))

export function focusFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector('[aria-invalid="true"], .fld-error')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (el instanceof HTMLElement && el.matches('input,textarea,select')) el.focus({ preventScroll: true })
  })
}

export function SectionForm({ sectionKey, initial, updatedAt }: { sectionKey: SectionKey; initial: unknown; updatedAt: string | null }) {
  const editor = sectionEditors[sectionKey]
  const [value, setValue] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  const [lastSaved, setLastSaved] = useState<string | null>(updatedAt)
  const [justSaved, setJustSaved] = useState(false)
  const dirty = JSON.stringify(value) !== JSON.stringify(saved)
  useUnsavedWarning(dirty)

  const change = useCallback((path: Path, next: unknown) => {
    setValue((v: unknown) => setIn(v, path, next))
    setErrors((e) => withoutErrors(e, path.join('.')))
    setFailure('')
    setJustSaved(false)
  }, [])

  const save = useCallback(async () => {
    if (saving || !dirty) return
    const parsed = sectionSchemas[sectionKey].safeParse(value)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      setFailure('Some fields need attention.')
      focusFirstError()
      return
    }
    setSaving(true)
    setFailure('')
    try {
      const result = await saveSection(sectionKey, parsed.data)
      if (!result.ok) {
        setErrors(result.errors ?? {})
        setFailure(result.message)
        if (result.errors) focusFirstError()
        return
      }
      setValue(parsed.data)
      setSaved(parsed.data)
      setErrors({})
      setJustSaved(true)
      setLastSaved(result.data?.updatedAt ?? new Date().toISOString())
    } catch {
      setFailure('Could not reach the server. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }, [saving, dirty, sectionKey, value])
  useSaveShortcut(save)

  const state: SaveState = saving
    ? { status: 'saving' }
    : failure
      ? { status: 'error', message: failure }
      : dirty
        ? { status: 'dirty' }
        : justSaved
          ? { status: 'saved', message: 'Saved. Your changes are live.' }
          : { status: 'clean', message: `Live · last edited ${timeAgo(lastSaved).toLowerCase()}` }

  return (
    <>
      {failure && Object.keys(errors).length > 0 && <div className="notice error">{failure} They’re highlighted below.</div>}
      <div className="adm-card adm-stack">
        {editor.fields.map((def) => (
          <FieldInput key={def.name} def={def} path={[def.name]} value={value} errors={errors} onChange={change} />
        ))}
      </div>
      <SaveBar state={state} onSave={save} onDiscard={() => (setValue(saved), setErrors({}), setFailure(''))} viewHref={`/${editor.anchor}`} />
    </>
  )
}

type InputProps = { def: FieldDef; path: Path; value: unknown; errors: FieldErrors; onChange: (path: Path, value: unknown) => void }

function FieldInput({ def, path, value, errors, onChange }: InputProps) {
  const key = path.join('.')
  const current = getIn(value, path)

  switch (def.kind) {
    case 'image':
      return (
        <ImageField
          label={def.label}
          help={def.help}
          optional={def.optional}
          folder="sections"
          value={current as ImageValue}
          onChange={(v) => onChange(path, v)}
          errors={{ src: errors[`${key}.src`], alt: errors[`${key}.alt`] }}
        />
      )
    case 'video':
      return (
        <ImageField
          label={def.label}
          help={def.help}
          accept="video"
          withAlt={false}
          optional
          folder="sections"
          value={{ src: String(current ?? ''), alt: '' }}
          onChange={(v) => onChange(path, v.src)}
          errors={{ src: errors[key] }}
        />
      )
    case 'list':
      return <ListInput def={def} path={path} value={value} errors={errors} onChange={onChange} />
    case 'textarea':
    case 'heading': {
      const text = String(current ?? '')
      return (
        <Field label={def.label} help={def.help} error={errors[key]}>
          {(p) => (
            <>
              <textarea {...p} className={`inp${def.kind === 'heading' ? ' heading' : ''}`} rows={def.rows ?? 4} value={text} onChange={(e) => onChange(path, e.target.value)} />
              {def.kind === 'heading' && /[*\n]/.test(text) && (
                <p className="fld-help" aria-hidden="true">
                  Preview: <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)' }}><Rich text={text} /></span>
                </p>
              )}
            </>
          )}
        </Field>
      )
    }
    default: {
      const text = String(current ?? '')
      return (
        <Field label={def.label} help={def.help} error={errors[key]}>
          {(p) => (
            <input
              {...p}
              className="inp"
              type={def.kind === 'url' || def.kind === 'email' || def.kind === 'date' || def.kind === 'time' ? def.kind : 'text'}
              inputMode={def.kind === 'url' ? 'url' : undefined}
              placeholder={def.kind === 'url' ? 'https://' : def.kind === 'youtube' ? 'https://www.youtube.com/watch?v=…' : undefined}
              value={text}
              onChange={(e) => onChange(path, e.target.value)}
              onBlur={def.kind === 'youtube' ? () => text && onChange(path, youtubeId(text)) : undefined}
            />
          )}
        </Field>
      )
    }
  }
}

let nextId = 0
const newId = () => ++nextId

function ListInput({ def, path, value, errors, onChange }: InputProps & { def: Extract<FieldDef, { kind: 'list' }> }) {
  const items = (getIn(value, path) as Json[]) ?? []
  // Stable keys so inputs and upload state follow their item when reordering.
  const [ids, setIds] = useState(() => items.map(() => newId()))
  if (ids.length !== items.length) setIds(items.map(() => newId())) // e.g. after "Discard"
  const key = path.join('.')

  const update = (next: Json[], nextIds: number[]) => {
    setIds(nextIds)
    onChange(path, next)
  }
  const move = (from: number, to: number) => {
    const next = [...items]
    const nextIds = [...ids]
    ;[next[from], next[to]] = [next[to], next[from]]
    ;[nextIds[from], nextIds[to]] = [nextIds[to], nextIds[from]]
    update(next, nextIds)
  }
  const min = def.min ?? 0

  return (
    <div className="fld" role="group" aria-label={def.label}>
      <div className="fld-top">
        <span className="fld-name">{def.label}</span>
        <span className="fld-count">
          {items.length}/{def.max}
        </span>
      </div>
      {def.help && <p className="fld-help">{def.help}</p>}
      <div className="lst">
        {items.map((item, i) => (
          <div className="lst-item" key={ids[i] ?? i}>
            <div className="lst-head">
              <i>{String(i + 1).padStart(2, '0')}</i>
              <b>{String(item[def.titleField] ?? '') || `New ${def.itemLabel.toLowerCase()}`}</b>
              {def.metaField && item[def.metaField] ? <small className="lst-meta">{listMeta(String(item[def.metaField]))}</small> : null}
              <button type="button" className="icon-btn" aria-label={`Move ${def.itemLabel} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                ↑
              </button>
              <button type="button" className="icon-btn" aria-label={`Move ${def.itemLabel} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
                ↓
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${def.itemLabel} ${i + 1}`}
                disabled={items.length <= min}
                onClick={() => {
                  if (confirm(`Remove this ${def.itemLabel.toLowerCase()}?`)) update(items.filter((_, j) => j !== i), ids.filter((_, j) => j !== i))
                }}
              >
                ✕
              </button>
            </div>
            <div className="lst-body">
              {def.fields.map((sub) => (
                <FieldInput key={sub.name} def={sub} path={[...path, i, sub.name]} value={value} errors={errors} onChange={onChange} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {errors[key] && (
        <p className="fld-error" role="alert">
          {errors[key]}
        </p>
      )}
      <div>
        <button type="button" className="btn ghost sm" disabled={items.length >= def.max} onClick={() => update([...items, def.empty()], [...ids, newId()])}>
          + Add {def.itemLabel.toLowerCase()}
        </button>
      </div>
    </div>
  )
}
