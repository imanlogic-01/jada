'use client'
import { useId, useRef, useState } from 'react'
import { imageSize, uploadFile } from '@/lib/upload'
import { IMAGE_TYPES, VIDEO_TYPES, type UploadFolder } from '@/lib/content/media'
import type { ImageValue } from '@/lib/content/sections'
import { Field } from './ui'

export const altFromName = (name: string) =>
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
  folder: UploadFolder
  errors?: { src?: string; alt?: string }
  optional?: boolean
  withAlt?: boolean
  /** 'video' turns this into a video picker (MP4/WebM, up to 50 MB) with a progress bar. */
  accept?: 'image' | 'video'
  /** Called with the pixel size of a newly uploaded image. */
  onSize?: (size: { width: number; height: number }) => void
}

export function ImageField({ label, help, value, onChange, folder, errors = {}, optional, withAlt = true, accept = 'image', onSize }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const video = accept === 'video'

  const handle = async (file: File | undefined) => {
    if (!file || busy) return
    setUploadError('')
    setBusy(true)
    setProgress(0)
    try {
      const size = video ? null : await imageSize(file)
      const result = await uploadFile(file, folder, accept, setProgress)
      if ('error' in result) setUploadError(result.error)
      else {
        onChange({ src: result.url, alt: value.alt || altFromName(file.name) })
        if (size) onSize?.(size)
      }
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
          {value.src && (video ? <video src={value.src} muted loop autoPlay playsInline /> : <img src={value.src} alt="" />)}
          {!value.src && (
            <span className="drop-hint">
              <b>Drop {video ? 'a video' : 'an image'} here</b>
              or click to choose
            </span>
          )}
          <span className="drop-over">
            {busy ? (
              <span className="drop-progress">
                <span className="spin" /> {progress > 0 ? `${Math.round(progress * 100)}%` : 'Starting'}
                <i style={{ transform: `scaleX(${progress})` }} />
              </span>
            ) : value.src ? (
              'Drop to replace'
            ) : (
              `Choose ${video ? 'video' : 'image'}`
            )}
          </span>
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
          <p className="fld-help">
            {help ? `${help} ` : ''}
            {video ? 'MP4 or WebM up to 50 MB.' : 'JPG, PNG, WebP or AVIF up to 8 MB.'}
          </p>
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
        accept={Object.keys(video ? VIDEO_TYPES : IMAGE_TYPES).join(',')}
        hidden
        onChange={(e) => {
          handle(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
