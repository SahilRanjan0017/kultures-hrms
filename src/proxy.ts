import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { checkTenantCached } from "@/lib/tenant-cache";

// ✅ 1. PRE-INITIALIZE ADMIN SUPABASE (FOR TENANT VALIDATION)
const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request });

    // ✅ 2. SKIP STATIC ASSETS
    if (request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.includes(".") ||
        request.nextUrl.pathname.startsWith("/api/")) {
        return response;
    }

    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost");
    const cookieDomain = isLocal ? "localhost" : ".kultures.io";

    // ✅ 3. INITIALIZE CLIENT SUPABASE
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, {
                            ...options,
                            domain: cookieDomain
                        })
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // ✅ 4. SUBDOMAIN EXTRACTION & VALIDATION
    const parts = host.split(".");
    let tenantSubdomain = "";

    if (parts.length >= 3) {
        tenantSubdomain = parts[0];
    } else if (parts.length === 2 && isLocal) {
        tenantSubdomain = parts[0];
    }

    if (tenantSubdomain === "www" || tenantSubdomain === "localhost" || tenantSubdomain === "app") {
        tenantSubdomain = "";
    }

    let tenantId = null;

    // ❗ SECURITY: Validate tenant existence (Stops random123.kultures.io)
    if (tenantSubdomain) {
        const tenantData = await checkTenantCached(tenantSubdomain, async (sub) => {
            const { data } = await adminSupabase
                .from("tenants")
                .select("id")
                .eq("subdomain", sub)
                .maybeSingle();
            return data;
        });

        if (!tenantData) {
            console.error(`→ [AUTH] Blocked invalid subdomain access: ${tenantSubdomain}`);
            return NextResponse.rewrite(new URL("/404", request.url));
        }
        tenantId = (tenantData as any).id;
    }

    // ✅ 5. REDIRECTS & AUTH PROTECTION
    const publicRoutes = ["/", "/auth/login", "/auth/callback", "/auth/set-password", "/auth/change-password", "/api/auth", "/api/onboarding", "/api/team", "/legal", "/privacy", "/contact"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (user && (pathname === "/" || pathname === "/auth/login")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ✅ 6. MEMBERSHIP & ISOLATION CHECK
    if (user && !isPublicRoute) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        // No tenant assigned? Force onboarding
        if (!profile?.tenant_id && pathname !== "/onboarding" && !pathname.startsWith("/api") && !pathname.startsWith("/auth")) {
            return NextResponse.redirect(new URL("/onboarding", request.url));
        }

        // ❗ SECURITY: Cross-Tenant Leaking Prevention
        // If they are on companyA.kultures.io but belong to companyB, block them.
        if (tenantId && profile?.tenant_id && profile.tenant_id !== tenantId) {
            console.error(`→ [AUTH] Tenant Mismatch: User belongs to ${profile.tenant_id} but tried accessing ${tenantId}`);
            // Redirect them to THEIR own dashboard
            // Note: In prod you would resolve their subdomain from the tenant_id
            return NextResponse.rewrite(new URL("/404", request.url));
        }
    }

    // ✅ 7. SUBDOMAIN INTERNAL REWRITE
    if (tenantSubdomain && !pathname.startsWith("/tenant")) {
        const isRoot = pathname === "/";
        const path = isRoot ? "/dashboard" : pathname;

        const rewriteResponse = NextResponse.rewrite(new URL(`/tenant/${tenantSubdomain}${path}`, request.url));

        // Ensure cookies are passed to the rewrite
        response.cookies.getAll().forEach(cookie => {
            rewriteResponse.cookies.set(cookie.name, cookie.value, { domain: cookieDomain });
        });

        return rewriteResponse;
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
