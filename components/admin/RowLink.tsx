'use client'
import { useRouter } from 'next/navigation'

/** Makes a whole table row clickable; the real link inside the row keeps it keyboard and screen-reader friendly. */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <tr
      onClick={(e) => {
        if (!(e.target as Element).closest('a,button')) router.push(href)
      }}
    >
      {children}
    </tr>
  )
}
