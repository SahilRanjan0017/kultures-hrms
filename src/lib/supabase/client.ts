import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * STRICT SINGLETON for the Supabase browser client.
 * Using globalThis to persist across HMR reloads and guarantee exactly one instance.
 */

let clientInstance: SupabaseClient | null = null;

const getClient = (): SupabaseClient => {
  const globalObj = globalThis as any;

  // Prefer the existing instance if already set in memory
  if (clientInstance) return clientInstance;

  // Use globalThis directly to persist during Next.js Hot Module Replacement (HMR)
  if (globalObj.__supabase_client) {
    clientInstance = globalObj.__supabase_client as SupabaseClient;
    return clientInstance;
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const isLocal = host.includes('localhost') || appUrl.includes('localhost');
  const parts = host.split('.');

  let cookieDomain = undefined;
  if (!isLocal) {
    if (host.includes('vercel.app') && parts.length >= 3) {
      cookieDomain = '.' + parts.slice(-3).join('.');
    } else if (parts.length >= 2) {
      cookieDomain = '.' + parts.slice(-2).join('.');
    }
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true, // Standard Supabase behavior, safe with singleton
        detectSessionInUrl: true,
      },
      cookieOptions: { domain: cookieDomain }
    }
  );

  globalObj.__supabase_client = client;
  clientInstance = client;
  return client;
}

/**
 * This is the ONLY function that should be exported to get the Supabase client on the client side.
 */
export function createClient() {
  return getClient();
}
