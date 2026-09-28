import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

/** Service-role client. Bypasses row-level security, so only call it after requireAdmin(). */
export function adminClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}

export const MEDIA_BUCKET = 'jada-media'
