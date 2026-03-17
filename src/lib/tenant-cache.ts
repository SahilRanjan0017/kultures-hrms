// Simple in-memory cache for tenant existence and metadata
// Note: In a real production edge environment, use Vercel KV or Upstash Redis
const tenantCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function checkTenantCached<T>(subdomain: string, fetchDataFn: (subdomain: string) => Promise<T | null>): Promise<T | null> {
    const cached = tenantCache.get(subdomain);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    const data = await fetchDataFn(subdomain);
    tenantCache.set(subdomain, { data, timestamp: now });
    return data;
}
