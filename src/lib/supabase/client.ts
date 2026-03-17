import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host.includes('localhost');
  const cookieDomain = isLocal ? 'localhost' : '.kultures.io';

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain
      }
    }
  )
}
