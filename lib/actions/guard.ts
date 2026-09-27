import 'server-only'
import { NotAuthorisedError, requireAdmin } from '@/lib/auth'
import type { ActionResult } from '@/lib/content/errors'

/** Runs an admin action after the auth check and turns unexpected failures into a friendly message. */
export async function guarded<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await requireAdmin()
    return await fn()
  } catch (error) {
    if (error instanceof NotAuthorisedError) return { ok: false, message: error.message }
    console.error(error)
    return { ok: false, message: 'Something went wrong. Please try again in a moment.' }
  }
}
