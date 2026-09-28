import './admin.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { devBypass } from '@/lib/auth'

export const metadata: Metadata = { title: 'JADA Admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const appearance = {
  variables: { colorPrimary: '#10110d', colorText: '#10110d', colorBackground: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif", borderRadius: '0px' },
}

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  if (devBypass) return children
  return (
    <ClerkProvider signInUrl="/admin/sign-in" signInFallbackRedirectUrl="/admin" afterSignOutUrl="/admin/sign-in" appearance={appearance}>
      {children}
    </ClerkProvider>
  )
}
