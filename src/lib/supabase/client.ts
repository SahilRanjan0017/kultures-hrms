import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Singleton instance of the Supabase browser client.
 * Using globalThis to persist across HMR reloads in development.
 */
const getClient = (): SupabaseClient => {
  const globalObj = globalThis as any;
  if (globalObj.__supabase_client) {
    return globalObj.__supabase_client;
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isLocal = host.includes('localhost') || appUrl.includes('localhost');
  const parts = host.split('.');
  let cookieDomain = undefined;
  if (isLocal) {
    cookieDomain = undefined;
  } else if (host.includes('vercel.app') && parts.length >= 3) {
    cookieDomain = '.' + parts.slice(-3).join('.');
  } else if (parts.length >= 2) {
    cookieDomain = '.' + parts.slice(-2).join('.');
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookieOptions: { domain: cookieDomain }
    }
  );

  globalObj.__supabase_client = client;
  return client;
}

export function createClient() {
  return getClient();
}
