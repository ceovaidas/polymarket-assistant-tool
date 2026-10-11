import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/** Service-role client. Server only: bypasses RLS, used for credits and jobs. Never import from client code. */
export function supabaseAdmin() {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
