import 'server-only'
import { auth } from '@clerk/nextjs/server'

/** Local-only escape hatch for working on the admin without Clerk keys. Ignored in production builds. */
export const devBypass = process.env.NODE_ENV === 'development' && process.env.ADMIN_DEV_BYPASS === 'true'

export type AdminState = { status: 'ok' } | { status: 'signed-out' } | { status: 'forbidden'; userId: string; configured: boolean }

export async function getAdminState(): Promise<AdminState> {
  if (devBypass) return { status: 'ok' }
  const { userId } = await auth()
  if (!userId) return { status: 'signed-out' }
  const adminId = process.env.CLERK_ADMIN_USER_ID
  if (adminId && userId === adminId) return { status: 'ok' }
  return { status: 'forbidden', userId, configured: Boolean(adminId) }
}

export class NotAuthorisedError extends Error {
  constructor() {
    super('Your session has expired. Sign in again to save changes.')
  }
}

/** Call at the top of every admin server action. */
export async function requireAdmin() {
  const state = await getAdminState()
  if (state.status !== 'ok') throw new NotAuthorisedError()
}
