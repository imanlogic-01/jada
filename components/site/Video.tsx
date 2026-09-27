'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const VideoContext = createContext<(id: string) => void>(() => {})

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  const close = useCallback(() => setId(null), [])

  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [id, close])

  return (
    <VideoContext.Provider value={setId}>
      {children}
      <div className={`modal${id ? ' open' : ''}`} aria-hidden={!id} role="dialog" aria-label="JADA video" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="modal-inner">
          <button className="modal-close" onClick={close}>Close ×</button>
          {id && <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title="JADA video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
        </div>
      </div>
    </VideoContext.Provider>
  )
}

export function VideoButton({ id, className, label, children }: { id: string; className: string; label?: string; children: React.ReactNode }) {
  const open = useContext(VideoContext)
  return (
    <button type="button" className={className} aria-label={label} onClick={() => open(id)}>
      {children}
    </button>
  )
}
