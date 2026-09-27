import { NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

const devBypass = process.env.NODE_ENV === 'development' && process.env.ADMIN_DEV_BYPASS === 'true'

// Clerk only runs on /admin, so the public site stays static and never loads auth.
// Access itself is checked where the data is: the admin layout and every server action (lib/auth.ts).
export default devBypass ? () => NextResponse.next() : clerkMiddleware()

export const config = { matcher: ['/admin/:path*'] }
