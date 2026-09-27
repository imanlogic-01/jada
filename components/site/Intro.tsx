'use client'
import Image from 'next/image'
import { useState } from 'react'
import { INTRO_KEY } from '@/lib/site/constants'
import { LOGO } from './Img'

/** "Enter JADA's World" splash. Shown once per browser session; hidden when arriving on a #section link. */
export function Intro() {
  const [leaving, setLeaving] = useState(false)

  const enter = () => {
    setLeaving(true)
    try {
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {}
    document.documentElement.classList.remove('intro-open')
    setTimeout(() => setLeaving(false), 1000)
  }

  return (
    <>
      <div className={`intro${leaving ? ' off' : ''}`} style={leaving ? { display: 'grid' } : undefined}>
        <div className="intro-inner">
          <Image className="intro-logo" src={LOGO.src} alt={LOGO.alt} width={900} height={220} sizes="430px" priority />
          <button className="enter" onClick={enter}>
            Enter JADA&apos;s World
          </button>
        </div>
      </div>
      <div className={`intro-fade${leaving ? ' go' : ''}`} />
    </>
  )
}
