'use client'
import { useEffect, useRef, useState } from 'react'
import type { SectionContent } from '@/lib/content/sections'
import { Rich } from '@/lib/content/format'
import { Img } from './Img'

type YouTubeCommand = 'playVideo' | 'pauseVideo' | 'mute' | 'unMute'

/**
 * Full-screen film that plays muted on a loop while it's on screen and pauses when it isn't.
 * Uses an uploaded video file when there is one, otherwise a background YouTube embed.
 */
export function Film({ c }: { c: SectionContent<'film'> }) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [near, setNear] = useState(false) // mount the YouTube player only when it's about to be seen
  const [visible, setVisible] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const mutedRef = useRef(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [started, setStarted] = useState(false) // with reduced motion, nothing plays until asked
  const youtube = !c.video && c.youtubeId

  useEffect(() => {
    const section = sectionRef.current!
    const reduce = matchMedia('(prefers-reduced-motion:reduce)')
    const syncReduce = () => setReduceMotion(reduce.matches)
    syncReduce()
    reduce.addEventListener('change', syncReduce)
    const nearby = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '100%' })
    const onScreen = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 })
    nearby.observe(section)
    onScreen.observe(section)
    return () => {
      nearby.disconnect()
      onScreen.disconnect()
      reduce.removeEventListener('change', syncReduce)
    }
  }, [])

  // Only hide the cover image once YouTube says it's really playing (it may be blocked or slow).
  useEffect(() => {
    if (!youtube) return
    const onMessage = (e: MessageEvent) => {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin) || typeof e.data !== 'string') return
      try {
        const data = JSON.parse(e.data)
        const state = data.event === 'onStateChange' ? data.info : data.info?.playerState
        if (state === 1) setPlaying(true)
      } catch {}
    }
    addEventListener('message', onMessage)
    return () => removeEventListener('message', onMessage)
  }, [youtube])

  const command = (func: YouTubeCommand) => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*')
  const shouldPlay = visible && (!reduceMotion || started)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = mutedRef.current // set the property directly: React doesn't reliably apply `muted`
      if (shouldPlay) video.play().catch(() => {})
      else video.pause()
    } else if (youtube && near) command(shouldPlay ? 'playVideo' : 'pauseVideo')
  }, [shouldPlay, youtube, near])

  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    mutedRef.current = next
    setStarted(true)
    if (videoRef.current) {
      videoRef.current.muted = next
      if (!next) videoRef.current.play().catch(() => {})
    } else {
      command(next ? 'mute' : 'unMute')
      command('playVideo')
    }
  }

  const src = youtube
    ? `https://www.youtube-nocookie.com/embed/${c.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${c.youtubeId}&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1`
    : ''

  return (
    <section className={`film${playing ? ' playing' : ''}`} id="film" data-panel={c.title ? c.title.replace(/\*/g, '') : 'Film'} ref={sectionRef} aria-label={c.title || 'JADA film'}>
      {c.video ? (
        <video
          ref={videoRef}
          src={c.video}
          muted
          loop
          playsInline
          preload="metadata"
          poster={c.poster.src || undefined}
          onPlaying={() => setPlaying(true)}
          aria-hidden="true"
        />
      ) : (
        youtube &&
        near &&
        (!reduceMotion || started) && (
          <div className="film-yt" aria-hidden="true">
            <iframe
              ref={frameRef}
              src={src}
              title={c.title || 'JADA film'}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
              // YouTube needs a moment to start; hide its loading chrome behind the cover image until then.
              onLoad={() => {
                // Ask the player to report its state, and apply sound if it was turned on before loading.
                frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'jada-film' }), '*')
                if (!mutedRef.current) command('unMute')
              }}
            />
          </div>
        )
      )}
      {c.poster.src && (
        <div className="film-poster">
          <Img image={c.poster} sizes="100vw" width={1600} height={900} />
        </div>
      )}
      <div className="film-shade" />
      {(c.label || c.title) && (
        <div className="film-caption" data-reveal>
          {c.label && <span className="section-label">{c.label}</span>}
          {c.title && (
            <h2 className="display">
              <Rich text={c.title} />
            </h2>
          )}
        </div>
      )}
      <button type="button" className="film-sound" onClick={toggleSound} aria-pressed={!muted}>
        <span className={`eq${!muted && shouldPlay ? ' on' : ''}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {reduceMotion && !started ? 'Play film' : muted ? 'Sound on' : 'Sound off'}
      </button>
    </section>
  )
}
