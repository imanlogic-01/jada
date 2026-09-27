'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { ImageValue } from '@/lib/content/sections'
import { LOGO } from './Img'

const LINKS = [
  ['Home', '/#home'],
  ['Music', '/#music'],
  ['Visuals', '/#visuals'],
  ['Journal', '/journal'],
  ['Press', '/#press'],
  ['Book', '/#book'],
  ['Join', '/#join'],
] as const

type Props = { feature: ImageValue; caption: string; footLeft: string; socials: string[] }

export function SiteChrome({ feature, caption, footLeft, socials }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    document.body.classList.toggle('lock', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
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
          <Image src={LOGO.src} alt={LOGO.alt} width={900} height={220} sizes="124px" priority />
        </a>
        <button className="menu-btn" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="menuOverlay">
          Menu
        </button>
      </header>
      <div className={`menu-overlay${open ? ' open' : ''}`} id="menuOverlay" aria-hidden={!open} inert={!open}>
        <div className="menu-head">
          <Image src={LOGO.src} alt={LOGO.alt} width={900} height={220} sizes="124px" />
          <button className="close-btn" onClick={() => setOpen(false)}>Close ×</button>
        </div>
        <div className="menu-grid">
          <nav className="menu-links">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          {feature.src && (
            <aside className="menu-feature">
              <Image src={feature.src} alt={feature.alt} width={940} height={940} sizes="470px" />
              <small>{caption}</small>
            </aside>
          )}
        </div>
        <div className="menu-foot">
          <span>{footLeft}</span>
          <span>{socials.join(' · ')}</span>
        </div>
      </div>
    </>
  )
}
