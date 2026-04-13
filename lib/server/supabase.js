import { createClient } from '@supabase/supabase-js';

let _adminClient = null;
let _publicClient = null;

/**
 * Returns a Supabase client using the service-role key (full admin access).
 * All security is enforced at the API layer — do not expose this client
 * directly to the browser.
 *
 * Required environment variables:
 *   SUPABASE_URL          — e.g. https://<project>.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role secret (never expose to clients)
 */
export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable');
  }

  _adminClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _adminClient;
}

/**
 * Returns a Supabase client using the public anon key (respects RLS).
 * Safe to use for unauthenticated read-only access.
 *
 * Required environment variables:
 *   SUPABASE_URL       — e.g. https://<project>.supabase.co
 *   SUPABASE_ANON_KEY  — anon / public key
 */
export function getSupabasePublic() {
  if (_publicClient) return _publicClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variable');
  }

  _publicClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _publicClient;
}
