'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Fades [data-reveal] blocks in as they enter the viewport (works with the sideways track too). */
export function Reveal() {
  const pathname = usePathname()
  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.13 })
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])
  return null
}
