import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  
  // Check if we have valid URLs (not placeholders)
  if (supabaseUrl === 'your_supabase_url' || supabaseUrl === 'https://placeholder.supabase.co') {
    // During build time, return a dummy client
    if (typeof window === 'undefined') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      );
    }
    // At runtime, throw an error
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}