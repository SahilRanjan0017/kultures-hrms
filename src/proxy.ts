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
    const { pathname, hostname } = request.nextUrl;

    // ✅ 2. SKIP STATIC ASSETS ONLY
    if (
        pathname.startsWith("/_next") ||
        (pathname.includes(".") && !pathname.startsWith("/api/"))
    ) {
        return response;
    }

    const isLocal = hostname.includes("localhost");
    const isVercel = hostname.includes("vercel.app");
    const parts = hostname.split(".");

    // Determine cookie domain for cross-subdomain auth
    let cookieDomain = isLocal ? undefined : ".kultures.io";

    if (isVercel && parts.length >= 3) {
        cookieDomain = "." + parts.slice(-3).join(".");
    } else if (!isLocal && parts.length >= 2) {
        cookieDomain = "." + parts.slice(-2).join(".");
    }

    // ✅ 3. INITIALIZE CLIENT SUPABASE
    // (Only if we actually need auth data for this request)
    const isApi = pathname.startsWith("/api/");
    const isPrefetch = request.headers.get("x-nextjs-prefetch") === "1";
    const publicRoutes = ["/", "/auth/login", "/auth/callback", "/auth/set-password", "/auth/change-password", "/api/auth", "/api/onboarding", "/api/team", "/legal", "/privacy", "/contact"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
    const skipAuthCheck = isApi || isPrefetch || isPublicRoute;

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
                    const nextResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        nextResponse.cookies.set(name, value, {
                            ...options,
                            ...(isLocal ? {} : { domain: cookieDomain })
                        })
                    );
                    response = nextResponse;
                },
            },
        }
    );

    // ─── CRITICAL OPTIMIZATION: Skip heavy auth calls for API/Prefetch ───
    // API routes handle their own auth. Prefetching shouldn't trigger token refresh.
    let user = null;
    if (!skipAuthCheck) {
        const { data: { user: foundUser }, error: authError } = await supabase.auth.getUser();

        // LOG AUTH FAILURES (Monitoring/Alerting)
        if (authError && authError.status === 429) {
            console.error("→ [AUTH] 429 Rate Limit in Middleware:", authError.message);
            await adminSupabase.from('activity_logs').insert({
                tenant_id: '00000000-0000-0000-0000-000000000000',
                actor_id: '00000000-0000-0000-0000-000000000000',
                action: 'auth:429_middleware',
                target_type: 'auth_system',
                metadata: { error: authError.message, path: pathname },
                ip_address: request.headers.get('x-forwarded-for') || '0.0.0.0'
            });
        }

        user = foundUser;
    }

    // ✅ 4. SUBDOMAIN EXTRACTION & VALIDATION
    let tenantSubdomain = "";

    if (isVercel) {
        // Vercel apps: [tenant].kultures-hrms.vercel.app (4 parts)
        // Main app: kultures-hrms.vercel.app (3 parts)
        if (parts.length >= 4) {
            tenantSubdomain = parts[0];
        }
    } else if (isLocal) {
        // Local dev: [tenant].localhost (2 parts)
        if (parts.length >= 2) {
            tenantSubdomain = parts[0];
        }
    } else {
        // Production: [tenant].kultures.io (3 parts)
        if (parts.length >= 3) {
            tenantSubdomain = parts[0];
        }
    }

    // Exclude special cases and base app name
    if (tenantSubdomain === "www" ||
        tenantSubdomain === "localhost" ||
        tenantSubdomain === "app" ||
        tenantSubdomain === "kultures-hrms") {
        tenantSubdomain = "";
    }

    let tenantId = null;

    // ❗ SECURITY: Validate tenant existence (Stops random123.kultures.io)
    if (tenantSubdomain) {
        const tenantData = await checkTenantCached(tenantSubdomain, async (sub) => {
            const { data } = await adminSupabase
                .from("tenants")
                .select("id")
                .eq("slug", sub)
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
    const handleRedirect = (path: string) => {
        const redirectResponse = NextResponse.redirect(new URL(path, request.url));
        response.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, {
                domain: cookie.domain,
                path: cookie.path,
                expires: cookie.expires,
                httpOnly: cookie.httpOnly,
                secure: cookie.secure,
                sameSite: cookie.sameSite,
            });
        });
        return redirectResponse;
    };

    if (!user && !isPublicRoute) {
        return handleRedirect("/auth/login");
    }

    if (user && (pathname === "/" || pathname === "/auth/login")) {
        return handleRedirect("/dashboard");
    }

    // ✅ 6. MEMBERSHIP & ISOLATION CHECK
    // (Only for page requests where auth was actually checked)
    if (user && !isPublicRoute && !isApi && !isPrefetch) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id, onboarding_completed, role, is_first_login")
            .eq("id", user.id)
            .single();

        // ❗ ENFORCEMENT: First login? Force password change.
        if (profile?.is_first_login && pathname !== "/auth/set-password" && !pathname.startsWith("/api")) {
            return handleRedirect("/auth/set-password");
        }

        // ❗ ENFORCEMENT: No tenant or onboarding not completed? Force onboarding.
        // ✅ EXCEPTION: Employees with a tenant_id skip the onboarding funnel.
        const isEmployeeWithTenant = profile?.role === "employee" && profile?.tenant_id;
        const needsOnboarding = !profile?.tenant_id || (!profile?.onboarding_completed && !isEmployeeWithTenant);

        if (needsOnboarding && pathname !== "/onboarding" && !pathname.startsWith("/auth") && !pathname.startsWith("/api")) {
            return handleRedirect("/onboarding");
        }

        // ❗ SECURITY: Cross-Tenant Leaking Prevention
        if (tenantId && profile?.tenant_id && profile.tenant_id !== tenantId) {
            console.error(`→ [AUTH] Tenant Mismatch: User belongs to ${profile.tenant_id} but tried accessing ${tenantId}`);
            return NextResponse.rewrite(new URL("/404", request.url));
        }
    }

    // ✅ 7. CSP & SECURITY HEADERS (Allow Extension)
    const extensionId = "19899a6a-0e40-4634-9ed3-bba4e5bf027d";
    const cspHeader = `script-src 'self' 'unsafe-inline' 'unsafe-eval' chrome-extension://${extensionId}/; object-src 'none'; base-uri 'self';`;

    // ✅ 8. SUBDOMAIN INTERNAL REWRITE
    if (tenantSubdomain && !pathname.startsWith("/tenant")) {
        const isRoot = pathname === "/";
        const path = isRoot ? "/dashboard" : pathname;

        const rewriteResponse = NextResponse.rewrite(new URL(`/tenant/${tenantSubdomain}${path}`, request.url));

        // Ensure cookies are passed to the rewrite
        response.cookies.getAll().forEach(cookie => {
            rewriteResponse.cookies.set(cookie.name, cookie.value, { domain: cookieDomain });
        });

        // Add CSP to rewrite
        rewriteResponse.headers.set("Content-Security-Policy", cspHeader);

        return rewriteResponse;
    }

    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
