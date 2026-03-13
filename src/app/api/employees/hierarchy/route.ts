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

        // Fetch all active employees for this tenant
        const { data: employees, error } = await adminSupabase
            .from("employees")
            .select(`
                id,
                full_name,
                emp_code,
                designation,
                department,
                location,
                profile_photo_url,
                manager_id,
                status
            `)
            .eq("tenant_id", membership.tenant_id)
            .eq("status", "active");

        if (error) throw error;

        // Build a hierarchy count (how many reportees for each manager)
        const reporteeCount: Record<string, number> = {};
        employees?.forEach(emp => {
            if (emp.manager_id) {
                reporteeCount[emp.manager_id] = (reporteeCount[emp.manager_id] || 0) + 1;
            }
        });

        const hierarchyData = employees?.map(emp => ({
            ...emp,
            reportees_count: reporteeCount[emp.id] || 0
        }));

        return NextResponse.json(hierarchyData);
    } catch (error: any) {
        console.error("Hierarchy API Error:", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
