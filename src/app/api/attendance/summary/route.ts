import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from("employees")
            .select("id, tenant_id")
            .eq("user_id", user.id)
            .single();

        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const searchParams = request.nextUrl.searchParams;
        const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
        const employeeId = searchParams.get("employee_id") || profile.id;

        const startDate = `${month}-01`;
        const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];

        const { data: logs, error: logsError } = await adminSupabase
            .from("attendance_logs")
            .select("*")
            .eq("employee_id", employeeId)
            .gte("date", startDate)
            .lt("date", endDate);

        if (logsError) throw logsError;

        const stats = {
            totalDays: logs.length,
            totalHours: logs.reduce((acc: number, log: any) => acc + (log.total_hours || 0), 0),
            lateDays: logs.filter((log: any) => log.status === 'late').length,
            averageHours: logs.length > 0
                ? (logs.reduce((acc: number, log: any) => acc + (log.total_hours || 0), 0) / logs.length).toFixed(1)
                : 0
        };

        return NextResponse.json({ ok: true, stats, month });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
