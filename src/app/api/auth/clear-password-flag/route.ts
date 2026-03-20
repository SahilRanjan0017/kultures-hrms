import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { ok: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const adminSupabase = createAdminClient();

        // 1. Clear flag in profiles
        await adminSupabase
            .from("profiles")
            .update({ is_first_login: false })
            .eq("id", user.id);

        // 2. Clear flag in tenant_members (for invited users)
        await adminSupabase
            .from("tenant_members")
            .update({ must_change_password: false })
            .eq("user_id", user.id);

        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error("→ Clear flag error:", err);
        return NextResponse.json(
            { ok: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
