'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SECTION_KEYS, sectionEditors } from '@/lib/content/sections'

export function Sidebar({ newBookings, signOut }: { newBookings: number; signOut: React.ReactNode }) {
  const pathname = usePathname()
  const link = (href: string, label: React.ReactNode, exact = false) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
    return (
      <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
        {label}
      </Link>
    )
  }

  return (
    <aside className="adm-side">
      <Link className="adm-brand" href="/admin">
        <Image src="/media/jada-logo.png" alt="JADA" width={900} height={220} sizes="92px" loading="eager" />
        <span>Editor</span>
      </Link>
      <nav className="adm-nav" aria-label="Admin">
        <div>
          {link('/admin', 'Overview', true)}
          {link(
            '/admin/bookings',
            <>
              Booking requests {newBookings > 0 && <span className="adm-badge" aria-label={`${newBookings} new`}>{newBookings}</span>}
            </>,
          )}
          {link('/admin/gallery', 'Gallery')}
          {link('/admin/journal', 'Journal')}
          {link('/admin/seo', 'SEO & sharing')}
        </div>
        <div>
          <span className="adm-label">Homepage</span>
          {SECTION_KEYS.map((key) => link(`/admin/sections/${key}`, sectionEditors[key].title))}
        </div>
      </nav>
      <div className="adm-side-foot">
        <a href="/" target="_blank" rel="noopener">
          View site
        </a>
        {signOut}
      </div>
    </aside>
  )
}
