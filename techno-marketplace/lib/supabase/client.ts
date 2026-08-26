import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern — prevents multiple GoTrueClient instances warning
let _client: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (_client) return _client
  _client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}
