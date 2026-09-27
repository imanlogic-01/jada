'use client'
import { SignOutButton } from '@clerk/nextjs'

export function SignOut() {
  return (
    <SignOutButton redirectUrl="/admin/sign-in">
      <button className="btn ghost sm" type="button">
        Sign out
      </button>
    </SignOutButton>
  )
}
