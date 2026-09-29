'use client'
import { useEffect, useId } from 'react'

type FieldProps = {
  label: string
  help?: string
  error?: string
  count?: { value: string; max: number }
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode
}

/** Label, help text, character counter and error message around any input. */
export function Field({ label, help, error, count, children }: FieldProps) {
  const id = useId()
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const length = count?.value.trim().length ?? 0
  return (
    <div className="fld">
      <div className="fld-top">
        <label htmlFor={id}>{label}</label>
        {count && (
          <span className={`fld-count${length > count.max ? ' over' : ''}`}>
            {length}/{count.max}
          </span>
        )}
      </div>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {help && (
        <p className="fld-help" id={`${id}-help`}>
          {help}
        </p>
      )}
      {error && (
        <p className="fld-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export type SaveState = { status: 'clean' | 'dirty' | 'saving' | 'saved' | 'error'; message?: string }

export function SaveBar({ state, onSave, onDiscard, saveLabel = 'Save & publish', viewHref, children }: {
  state: SaveState
  onSave: () => void
  onDiscard?: () => void
  saveLabel?: string
  viewHref?: string
  children?: React.ReactNode
}) {
  const text =
    state.message ??
    { clean: 'All changes are live', dirty: 'Unsaved changes', saving: 'Saving…', saved: 'Saved and live', error: 'Could not save' }[state.status]
  const busy = state.status === 'saving'
  return (
    <div className="savebar" role="region" aria-label="Save changes">
      <div className={`savebar-status ${state.status}`} role="status" aria-live="polite">
        <i />
        {/* "Edited 1 minute ago" can tick over between the server render and the browser. */}
        <span suppressHydrationWarning>{text}</span>
      </div>
      <div className="savebar-actions">
        {children}
        {viewHref && (
          <a className="btn ghost" href={viewHref} target="_blank" rel="noopener">
            View live
          </a>
        )}
        {onDiscard && state.status === 'dirty' && (
          <button className="btn ghost" type="button" onClick={onDiscard}>
            Discard
          </button>
        )}
        <button className="btn gold" type="button" onClick={onSave} disabled={busy || state.status === 'clean' || state.status === 'saved'}>
          {busy && <span className="spin" />}
          {busy ? 'Saving' : saveLabel}
        </button>
      </div>
    </div>
  )
}

/** Warns before closing the tab or following a link while there are unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || e.defaultPrevented) return
      if (!confirm('You have unsaved changes. Leave without saving?')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', click, true)
    return () => {
      removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', click, true)
    }
  }, [dirty])
}

/** Save with Cmd/Ctrl+S. */
export function useSaveShortcut(save: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [save])
}
