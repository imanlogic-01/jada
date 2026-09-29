'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { ImageValue } from '@/lib/content/sections'
import { LOGO } from './Img'

const LINKS = [
  ['Home', '/#home'],
  ['Live', '/#live'],
  ['Music', '/#music'],
  ['Visuals', '/#visuals'],
  ['Gallery', '/gallery'],
  ['Journal', '/journal'],
  ['Press', '/#press'],
  ['Book', '/#book'],
  ['Join', '/#join'],
] as const

type Props = { feature: ImageValue; caption: string; socials: { label: string; url: string }[] }

/** Name top left (back to home) and a compact drop-down menu top right. */
export function SiteChrome({ feature, caption, socials }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const panel = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false)
    }
    addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    panel.current?.querySelector('a')?.focus({ preventScroll: true })
    return () => {
      removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  // Close the menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  return (
    <>
      <header className="topbar">
        {/* Plain links for /#section: the homepage scroll engine intercepts them to glide sideways. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/#home" className="brand" aria-label="JADA home">
          <Image src={LOGO.src} alt={LOGO.alt} width={1011} height={247} sizes="124px" priority />
        </a>
      </header>
      {/* Outside the header so it can invert against the page behind it and stay visible on any colour. */}
      <button ref={button} className="menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="siteMenu">
        <span className="burger" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="sr-only">{open ? 'Close menu' : 'Menu'}</span>
      </button>
      <div className={`dropdown${open ? ' open' : ''}`} id="siteMenu" ref={panel} inert={!open} aria-hidden={!open}>
        <nav className="dropdown-links" aria-label="Site">
          {LINKS.map(([label, href], i) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{ '--i': i } as React.CSSProperties}>
              {label}
            </a>
          ))}
        </nav>
        {feature.src && (
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- the homepage handles #section links itself
          <a className="dropdown-feature" href="/#music" onClick={() => setOpen(false)}>
            <Image src={feature.src} alt="" width={120} height={120} sizes="56px" />
            <small>{caption}</small>
          </a>
        )}
        {socials.length > 0 && (
          <div className="dropdown-socials">
            {socials.map((s) => (
              <a key={s.url + s.label} href={s.url} target="_blank" rel="noopener">
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
