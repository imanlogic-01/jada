'use client'
import { useId, useRef, useState } from 'react'
import { createImageUpload } from '@/lib/actions/upload'
import { browserClient } from '@/lib/supabase/browser'
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/content/images'
import type { ImageValue } from '@/lib/content/sections'
import { Field } from './ui'

/** Uploads straight to Supabase Storage through a signed URL issued by the server after the admin check. */
export async function uploadImage(file: File, folder: string): Promise<{ url: string } | { error: string }> {
  if (!(file.type in IMAGE_TYPES)) return { error: 'Use a JPG, PNG, WebP or AVIF image.' }
  if (file.size > MAX_IMAGE_BYTES) return { error: `This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Images must be 8 MB or smaller.` }
  const ticket = await createImageUpload({ type: file.type, size: file.size, folder })
  if (!ticket.ok || !ticket.data) return { error: ticket.ok ? 'Upload failed. Please try again.' : ticket.message }
  const { error } = await browserClient().storage.from('jada-media').uploadToSignedUrl(ticket.data.path, ticket.data.token, file, { contentType: file.type })
  if (error) return { error: 'Upload failed. Check your connection and try again.' }
  return { url: ticket.data.publicUrl }
}

const altFromName = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

type Props = {
  label: string
  help?: string
  value: ImageValue
  onChange: (value: ImageValue) => void
  folder: 'sections' | 'journal' | 'seo'
  errors?: { src?: string; alt?: string }
  optional?: boolean
  withAlt?: boolean
}

export function ImageField({ label, help, value, onChange, folder, errors = {}, optional, withAlt = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handle = async (file: File | undefined) => {
    if (!file || busy) return
    setUploadError('')
    setBusy(true)
    try {
      const result = await uploadImage(file, folder)
      if ('error' in result) setUploadError(result.error)
      else onChange({ src: result.url, alt: value.alt || altFromName(file.name) })
    } catch {
      setUploadError('Upload failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const error = uploadError || errors.src
  return (
    <div className="fld" role="group" aria-labelledby={nameId}>
      <span className="fld-name" id={nameId}>
        {label}
      </span>
      <div className="drop">
        <div
          className={`drop-zone${over ? ' over' : ''}${busy ? ' busy' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={value.src ? `Replace ${label}` : `Upload ${label}`}
          aria-busy={busy}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            handle(e.dataTransfer.files[0])
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- plain preview of any uploaded file */}
          {value.src && <img src={value.src} alt="" />}
          {!value.src && (
            <span className="drop-hint">
              <b>Drop an image here</b>
              or click to choose
            </span>
          )}
          <span className="drop-over">{busy ? <span className="spin" /> : value.src ? 'Drop to replace' : 'Choose image'}</span>
        </div>
        <div className="drop-side">
          {withAlt && (
            <Field label="Image description" help="Describes the image for screen readers and search engines." error={errors.alt} count={{ value: value.alt, max: 160 }}>
              {(p) => <input {...p} className="inp" value={value.alt} maxLength={200} onChange={(e) => onChange({ ...value, alt: e.target.value })} />}
            </Field>
          )}
          <div className="drop-actions">
            <button type="button" className="btn ghost sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? 'Uploading…' : value.src ? 'Replace' : 'Upload'}
            </button>
            {optional && value.src && (
              <button type="button" className="btn ghost sm" onClick={() => onChange({ src: '', alt: '' })} disabled={busy}>
                Remove
              </button>
            )}
          </div>
          <p className="fld-help">{help ? `${help} ` : ''}JPG, PNG, WebP or AVIF up to 8 MB.</p>
          {error && (
            <p className="fld-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(IMAGE_TYPES).join(',')}
        hidden
        onChange={(e) => {
          handle(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
