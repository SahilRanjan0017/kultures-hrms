import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    const parts = host.split(".");
    let cookieDomain = undefined;
    if (isLocal) {
        cookieDomain = undefined;
    } else if (host.includes("vercel.app") && parts.length >= 3) {
        cookieDomain = "." + parts.slice(-3).join(".");
    } else if (parts.length >= 2) {
        cookieDomain = "." + parts.slice(-2).join(".");
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set({
                                name,
                                value,
                                ...options,
                                domain: isLocal ? undefined : cookieDomain // Allow cookies to work across subdomains
                            });
                        });
                    } catch {
                        // Ignore — called from Server Component
                    }
                },
            },
        }
    );
}
