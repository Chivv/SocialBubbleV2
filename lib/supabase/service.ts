import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  
  // Check if we're using placeholder values
  const isPlaceholder = supabaseUrl === 'your_supabase_url' || 
                        supabaseUrl === 'your_supabase_url/' ||
                        !supabaseUrl || 
                        supabaseUrl === 'https://placeholder.supabase.co';
  
  // During build, use placeholder values
  if (isPlaceholder) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // During build time, use safe placeholder values
      return createSupabaseClient(
        'https://placeholder.supabase.co',
        'placeholder-service-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    }
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}