import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { syncUserSession } from "@/lib/auth-sync";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const token_hash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");
    const next = requestUrl.searchParams.get("next") ?? "/dashboard";

    console.log("→ Callback hit, code:", code, "token_hash:", token_hash);

    const cookieStore = await cookies();

    const supabase = createServerClient(
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
                            cookieStore.set({ name, value, ...options });
                        });
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    );

    let authSuccess = false;

    // Supabase email templates use {{ .TokenHash }} which often gets mapped to `code=` in the URL.
    // So if we have one of these types and `code` but no `token_hash`, the code IS the token_hash.
    const otpTypes = ["email", "signup", "invite", "recovery", "magiclink"];
    const actualTokenHash = token_hash || (otpTypes.includes(type || "") ? code : null);

    if (actualTokenHash && type) {
        // Cast type to EmailOtpType or MobileOtpType, Supabase expects specific strings here 
        const { error } = await supabase.auth.verifyOtp({
            token_hash: actualTokenHash,
            type: type as "magiclink" | "email" | "recovery" | "invite" | "signup",
        });

        if (error) {
            console.error("→ OTP error:", error.message);
            return NextResponse.redirect(
                new URL(`/?error=otp_expired`, requestUrl.origin)
            );
        }

        console.log("→ OTP verified ✅");
        authSuccess = true;
    } else if (code) {
        // Only run exchangeCodeForSession if we didn't just consume the code as a token_hash
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("→ Code exchange error:", error.message);
            return NextResponse.redirect(
                new URL(`/?error=auth_failed`, requestUrl.origin)
            );
        }

        console.log("→ Session exchanged ✅");
        authSuccess = true;
    }

    if (!authSuccess) {
        console.log("→ No valid token or code");
        return NextResponse.redirect(new URL("/", requestUrl.origin));
    }

    // Now redirect, letting the middleware handle any next smart routing if needed
    // We will do a bit of smart routing here as well
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL("/", requestUrl.origin));
    }

    // ✅ Robust Server-Side Sync for existing employees
    const syncProfile = await syncUserSession(user.id, user.email!, supabase);

    // Fallback to existing profile check if sync didn't find an employee
    const profile = syncProfile || (await supabase
        .from("profiles")
        .select("tenant_id, is_first_login, role, employee_id")
        .eq("id", user.id)
        .single()).data;

    if (profile?.is_first_login) {
        return NextResponse.redirect(new URL("/auth/set-password", requestUrl.origin));
    }

    if (!profile?.tenant_id) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));

}
