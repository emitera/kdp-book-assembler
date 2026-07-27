import { createClient } from '@supabase/supabase-js';

/**
 * Instantiates the Supabase client using environment variables.
 * We use the service_role key to allow the backend worker to bypass RLS policies
 * and write payment/subscription updates.
 * @param env - The Cloudflare Worker environment bindings
 */
export function getSupabaseClient(env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
