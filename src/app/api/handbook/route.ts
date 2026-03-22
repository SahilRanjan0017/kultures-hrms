import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

        const { data: policies, error } = await adminSupabase
            .from("company_policies")
            .select("*")
            .eq("tenant_id", membership.tenant_id)
            .is("deleted_at", null)
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(policies);
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const adminSupabase = createAdminClient();

        // Check if user is Admin or HR
        const { data: membership } = await adminSupabase
            .from("tenant_members")
            .select("tenant_id, role")
            .eq("user_id", user.id)
            .single();

        if (!membership || !["admin", "hr"].includes(membership.role)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { title, file_url, category, icon } = body;

        const { data, error } = await adminSupabase
            .from("company_policies")
            .insert({
                tenant_id: membership.tenant_id,
                title,
                file_url,
                category: category || "general",
                icon: icon || "file-text",
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
