import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let cachedSessionId = '';
let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Returns a Supabase client that sends x-session-id header
 * so RLS policies can restrict data to the current session.
 */
export function getSessionClient(sessionId: string) {
  if (cachedClient && cachedSessionId === sessionId) {
    return cachedClient;
  }
  cachedSessionId = sessionId;
  cachedClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        'x-session-id': sessionId,
      },
    },
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cachedClient;
}
