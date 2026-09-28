import type { z } from 'zod'

export type FieldErrors = Record<string, string>
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; message: string; errors?: FieldErrors }

/** Flattens zod issues to { 'films.0.title': 'Required' } so forms can show each message next to its field. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
