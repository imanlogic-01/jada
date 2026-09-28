import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getAdminState, devBypass } from '@/lib/auth'
import { countNewBookings } from '@/lib/content/admin-queries'
import { Sidebar } from '@/components/admin/Sidebar'
import { SignOut } from '@/components/admin/SignOut'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const state = await getAdminState()
  if (state.status === 'signed-out') redirect('/admin/sign-in')
  if (state.status === 'forbidden')
    return (
      <main className="adm-center">
        <div className="adm-center-inner">
          <Image src="/media/jada-logo.webp" alt="JADA" width={1011} height={247} />
          <h1>No access</h1>
          {state.configured ? (
            <p>This account isn’t the site editor. Sign out and sign in with the editor account.</p>
          ) : (
            <>
              <p>
                Almost there. To make this account the site editor, add this value as <b>CLERK_ADMIN_USER_ID</b> in the Vercel project’s environment variables, then redeploy.
              </p>
              <code className="adm-code">{state.userId}</code>
            </>
          )}
          <SignOut />
        </div>
      </main>
    )

  // A failed count shouldn't lock the editor out of everything else.
  const newBookings = await countNewBookings().catch(() => 0)

  return (
    <div className="adm">
      <Sidebar newBookings={newBookings} signOut={devBypass ? null : <SignOut />} />
      <main className="adm-main">{children}</main>
    </div>
  )
}
