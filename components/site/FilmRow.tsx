'use client'
import { useRef } from 'react'

/** Drag-to-scroll row of film stills in the vertical layout. On the sideways homepage it simply sits in the track. */
export function FilmRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number } | null>(null)

  return (
    <div
      className="film-row"
      ref={ref}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' || document.documentElement.classList.contains('h-mode')) return
        if ((e.target as Element).closest('button')) return
        drag.current = { x: e.clientX, left: ref.current!.scrollLeft }
        ref.current!.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (drag.current) ref.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x)
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {children}
    </div>
  )
}
