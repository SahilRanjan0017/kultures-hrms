import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { ok: false, message: "Email is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        console.log("Sending password setup email to:", email);
        console.log("Redirect URL:", `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/set-password`);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/set-password`,
                shouldCreateUser: true,
            },
        });

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json(
                { ok: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { ok: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
