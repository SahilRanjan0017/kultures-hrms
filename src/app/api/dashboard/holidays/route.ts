import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const adminSupabase = createAdminClient();

        // Get tenant_id for the current user
        const { data: membership } = await adminSupabase
            .from("tenant_members")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();

        if (!membership) return new NextResponse("Forbidden", { status: 403 });

        const { data: holidays, error } = await adminSupabase
            .from("holidays")
            .select("*")
            .eq("tenant_id", membership.tenant_id)
            .order("date", { ascending: true });

        if (error) throw error;

        return NextResponse.json(holidays);
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
