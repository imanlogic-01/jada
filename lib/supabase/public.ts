import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

/** Read-only client using the public key; row-level security limits it to published content. */
export function publicClient() {
  if (client === undefined) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  }
  return client
}
