'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { ImageValue } from '@/lib/content/sections'
import { INTRO_KEY } from '@/lib/site/constants'
import { Img, LOGO } from './Img'

const DURATION = 1900

/**
 * Cinematic "Enter JADA's World" splash, shown once per browser session: the hero photo settles
 * behind a dark veil, the gold logo is wiped in, a counter runs to 100, and entering lifts the
 * whole screen away like a curtain.
 */
export function Intro({ hero }: { hero: ImageValue }) {
  const [count, setCount] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const ready = count >= 100

  useEffect(() => {
    if (!document.documentElement.classList.contains('intro-open')) return
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - start) / DURATION)
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const enter = () => {
    if (leaving) return
    setLeaving(true)
    try {
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {}
    setTimeout(() => {
      document.documentElement.classList.remove('intro-open')
      setLeaving(false)
    }, 1150)
  }

  return (
    <div className={`intro${ready ? ' ready' : ''}${leaving ? ' off' : ''}`} role="dialog" aria-label="Welcome">
      <div className="intro-bg" aria-hidden="true">
        <Img image={hero} sizes="100vw" width={1800} height={1800} priority />
      </div>
      <div className="intro-inner">
        <Image className="intro-logo" src={LOGO.src} alt={LOGO.alt} width={1011} height={247} sizes="430px" priority />
        <button className="enter" onClick={enter} disabled={!ready}>
          Enter JADA&apos;s World
        </button>
      </div>
      <div className="intro-count" aria-hidden="true">
        {String(count).padStart(3, '0')}
      </div>
      <div className="intro-line" aria-hidden="true">
        <i style={{ transform: `scaleX(${count / 100})` }} />
      </div>
    </div>
  )
}
