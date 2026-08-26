import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Browser client — uses anon key, no auth session required
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
