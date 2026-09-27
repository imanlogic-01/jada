'use client'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { ImageValue } from '@/lib/content/sections'

/** Hero photo with the slow zoom-in on load and a soft pan that follows the pointer. */
export function HeroImage({ image }: { image: ImageValue }) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = ref.current!
    const hero = img.closest('.hero') as HTMLElement
    const timer = setTimeout(() => hero.classList.add('ready'), 700)
    const move = (e: PointerEvent) => {
      if (matchMedia('(pointer:coarse)').matches) return
      const x = (e.clientX / innerWidth - 0.5) * 1.5
      const y = (e.clientY / innerHeight - 0.5) * 1.2
      img.style.transform = `scale(1.018) translate(${x}%,${y}%)`
    }
    const leave = () => (img.style.transform = 'scale(1)')
    hero.addEventListener('pointermove', move)
    hero.addEventListener('pointerleave', leave)
    return () => {
      clearTimeout(timer)
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
    }
  }, [])

  return <Image ref={ref} src={image.src} alt={image.alt} width={1800} height={1800} sizes="100vw" priority />
}
