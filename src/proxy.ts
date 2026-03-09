import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // Bypass middleware for the callback route to prevent cookies from being mutated before exchangeCodeForSession
    if (request.nextUrl.pathname.startsWith("/auth/callback")) {
        return supabaseResponse;
    }

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
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/callback",
        "/auth/set-password",
        "/auth/change-password",
        "/api/auth",
        "/api/onboarding",
        "/api/team",
    ];

    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Not logged in + protected route → login
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Logged in + landing/login → dashboard
    if (user && (pathname === "/" || pathname === "/auth/login")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ✅ Logged in + /onboarding → check if already has tenant
    // ✅ NEW — use profiles table
    if (user && pathname === "/onboarding") {
        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

        if (profile?.tenant_id) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }


    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

