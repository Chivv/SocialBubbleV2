import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminClient: SupabaseClient | null = null;

// Admin client bypasses RLS - lazy initialization
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // During build, return a dummy client if env vars are not set
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your_supabase_url') {
      if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
        // During build time, create a dummy client that won't be used
        return createClient('https://placeholder.supabase.co', 'placeholder-key', {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
      }
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseAdminClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: (url, options = {}) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            return fetch(url, {
              ...options,
              signal: controller.signal,
            }).finally(() => clearTimeout(timeout));
          },
        },
      }
    );
  }
  
  return supabaseAdminClient;
}

// For backward compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabaseAdmin();
    return Reflect.get(client, prop, receiver);
  }
});