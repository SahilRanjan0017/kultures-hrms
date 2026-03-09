import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get requester profile
        const { data: profile, error: profError } = await adminSupabase
            .from("employees")
            .select("id, tenant_id, role")
            .eq("user_id", user.id)
            .single();

        if (profError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const searchParams = request.nextUrl.searchParams;
        const employeeId = searchParams.get("employee_id");
        const month = searchParams.get("month"); // YYYY-MM
        const limit = parseInt(searchParams.get("limit") || "50");

        let query = adminSupabase
            .from("attendance_logs")
            .select(`
                *,
                employees (
                    full_name,
                    emp_code,
                    department,
                    designation
                )
            `)
            .eq("tenant_id", profile.tenant_id)
            .order("clock_in", { ascending: false })
            .limit(limit);

        // RBAC and filtering
        if (profile.role === "employee") {
            // Employees only see their own
            query = query.eq("employee_id", profile.id);
        } else if (profile.role === "manager") {
            // Managers see their own or their team (if filtered)
            if (employeeId) {
                query = query.eq("employee_id", employeeId);
            } else {
                // If no specific employee requested, show their own or maybe we need team logic here later
                // For now, let's keep it simple: show all tenant logs if manager/admin/hr
                // but usually managers only see their department
            }
        } else if (employeeId) {
            // Admin/HR filtering by employee
            query = query.eq("employee_id", employeeId);
        }

        if (month) {
            const startDate = `${month}-01`;
            const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)).toISOString().split('T')[0];
            query = query.gte("date", startDate).lt("date", endDate);
        }

        const { data: logs, error: logsError } = await query;

        if (logsError) throw logsError;

        return NextResponse.json({
            ok: true,
            logs
        });

    } catch (err: any) {
        console.error("Fetch attendance error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
