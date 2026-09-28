import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="adm-center">
      <div className="adm-center-inner">
        <Image src="/media/jada-logo.webp" alt="JADA" width={1011} height={247} priority />
        <span className="adm-label">Site editor</span>
        <SignIn routing="path" path="/admin/sign-in" />
      </div>
    </main>
  )
}
