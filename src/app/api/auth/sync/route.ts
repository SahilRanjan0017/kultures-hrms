import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserSession } from "@/lib/auth-sync";

export async function POST(request: NextRequest) {
    try {
        console.log("→ [API] /api/auth/sync: Started");
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.log("→ [API] /api/auth/sync: Not authenticated");
            return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
        }

        console.log("→ [API] /api/auth/sync: Found user", user.email);
        const profile = await syncUserSession(user.id, user.email!, supabase);

        if (!profile) {
            console.log("→ [API] /api/auth/sync: Sync failed (no employee record)");
            return NextResponse.json({ ok: true, synced: false, message: "No employee record found" });
        }

        console.log("→ [API] /api/auth/sync: Sync success");
        return NextResponse.json({
            ok: true,
            synced: true,
            profile,
            tenantId: profile.tenant_id
        });

    } catch (err: any) {
        console.error("→ [API] /api/auth/sync: Unexpected error:", err.message);
        return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
    }
}
