'use client'
import { useEffect, useRef } from 'react'
import { H_QUERY } from '@/lib/site/constants'

/**
 * Desktop homepage: native vertical scrolling (wheel, keys, scrollbar) drives a sideways track of
 * full-height panels with an eased glide. Phones and short screens keep the normal vertical page.
 */
export function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current!
    const track = trackRef.current!
    const root = document.documentElement
    const query = matchMedia(H_QUERY)
    const reduce = matchMedia('(prefers-reduced-motion:reduce)')
    const panels = [...track.querySelectorAll<HTMLElement>('[data-panel]')]
    const parallax = [...track.querySelectorAll<HTMLElement>('[data-parallax]')]
    let on = false
    let max = 0
    let target = 0
    let current = 0
    let raf = 0
    let index = -1

    const tick = () => {
      raf = 0
      if (!on) return
      current += (target - current) * 0.085
      if (Math.abs(target - current) < 0.3) current = target
      track.style.transform = `translate3d(${-current}px,0,0)`
      for (const el of parallax) {
        const r = el.getBoundingClientRect()
        if (r.right < 0 || r.left > innerWidth) continue
        el.style.setProperty('--px', `${(((r.left + r.width / 2 - innerWidth / 2) / innerWidth) * -7).toFixed(2)}%`)
      }
      barRef.current!.style.transform = `scaleX(${max ? current / max : 0})`
      let i = 0
      panels.forEach((p, n) => {
        if (p.offsetLeft <= current + innerWidth * 0.5) i = n
      })
      if (current >= max - 1) i = panels.length - 1
      if (i !== index && panels[i]) {
        index = i
        const pad = (n: number) => String(n).padStart(2, '0')
        countRef.current!.textContent = `${pad(i + 1)} / ${pad(panels.length)}`
        nameRef.current!.textContent = panels[i].dataset.panel ?? ''
      }
      if (current !== target) raf = requestAnimationFrame(tick)
    }
    const sync = (jump = false) => {
      target = Math.min(max, Math.max(0, scrollY - wrap.offsetTop))
      if (jump || reduce.matches) current = target
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const go = (el: Element, pad = 0, smooth = !reduce.matches) => {
      const x = el.getBoundingClientRect().left - track.getBoundingClientRect().left - pad
      scrollTo({ top: wrap.offsetTop + Math.min(max, Math.max(0, x)), behavior: smooth ? 'smooth' : 'instant' })
    }
    const measure = () => {
      const next = query.matches
      root.classList.toggle('h-mode', next)
      if (!next) {
        if (on) {
          wrap.style.height = ''
          track.style.transform = ''
          parallax.forEach((el) => el.style.removeProperty('--px'))
        }
        on = false
        return
      }
      on = true
      max = Math.max(0, track.scrollWidth - innerWidth)
      wrap.style.height = `${max + innerHeight}px`
      sync(true)
    }

    const onScroll = () => on && sync()
    // In-page links (#music, /#music) jump to their panel.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href*="#"]') as HTMLAnchorElement | null
      if (!on || !a || a.pathname !== location.pathname) return
      const el = document.getElementById(a.hash.slice(1))
      if (!el || !track.contains(el)) return
      e.preventDefault()
      go(el)
      history.replaceState(null, '', a.hash)
    }
    const locked = () => document.body.classList.contains('lock') || root.classList.contains('intro-open') || !!document.querySelector('.modal.open, .lightbox')
    // Sideways trackpad swipes and left/right keys also move the track.
    const onWheel = (e: WheelEvent) => {
      if (!on || locked() || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      scrollBy({ top: e.deltaX, behavior: 'instant' })
    }
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!on || !dir || locked() || (e.target as Element).closest?.('input,textarea,select')) return
      e.preventDefault()
      scrollBy({ top: dir * innerWidth * 0.6, behavior: reduce.matches ? 'instant' : 'smooth' })
    }
    // Keep keyboard focus visible inside the clipped track.
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Element
      if (!on || !track.contains(el)) return
      const r = el.getBoundingClientRect()
      if (r.left < 0 || r.right > innerWidth) go(el, innerWidth * 0.2)
    }

    measure()
    if (on && location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el && track.contains(el)) go(el, 0, false)
    }
    const resize = new ResizeObserver(() => measure())
    resize.observe(track)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', measure)
    query.addEventListener('change', measure)
    document.addEventListener('click', onClick)
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    document.addEventListener('focusin', onFocus)
    return () => {
      cancelAnimationFrame(raf)
      resize.disconnect()
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', measure)
      query.removeEventListener('change', measure)
      document.removeEventListener('click', onClick)
      removeEventListener('wheel', onWheel)
      removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocus)
      root.classList.remove('h-mode')
    }
  }, [])

  return (
    <>
      <div className="h-wrap" ref={wrapRef}>
        <div className="h-sticky">
          <div className="h-track" ref={trackRef}>
            {children}
          </div>
        </div>
      </div>
      <div className="h-progress" aria-hidden="true">
        <span ref={countRef}>01 / 01</span>
        <span className="h-bar">
          <i ref={barRef} />
        </span>
        <span ref={nameRef}>Home</span>
      </div>
    </>
  )
}
