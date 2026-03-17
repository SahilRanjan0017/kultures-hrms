import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // Resolve tenant and role
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.tenant_id || !['admin', 'hr', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        // Fetch attendance logs with location data
        let query = adminSupabase
            .from('attendance_logs')
            .select(`
                id,
                clock_in,
                clock_out,
                clock_in_lat,
                clock_in_lng,
                clock_out_lat,
                clock_out_lng,
                employee:employee_id (
                    full_name,
                    designation
                )
            `)
            .eq('tenant_id', profile.tenant_id)
            .order('clock_in', { ascending: false })
            .limit(1000);

        const { data: logs, error } = await query;

        if (error) throw error;

        return NextResponse.json({ logs });

    } catch (err: any) {
        console.error("Attendance map API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
