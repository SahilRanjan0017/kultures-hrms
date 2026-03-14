import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get employee and tenant info
        const adminSupabase = createAdminClient();
        const { data: employee, error: empError } = await adminSupabase
            .from("employees")
            .select("id, tenant_id")
            .eq("user_id", user.id)
            .single();

        if (empError || !employee) {
            return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 2. Check for an active session (clocked in but not out)
        const { data: activeLog, error: logError } = await adminSupabase
            .from("attendance_logs")
            .select("*")
            .eq("employee_id", employee.id)
            .is("clock_out", null)
            .order("clock_in", { ascending: false })
            .limit(1)
            .single();

        if (activeLog) {
            // CLOCK OUT
            const clockIn = new Date(activeLog.clock_in);
            const durationMs = now.getTime() - clockIn.getTime();
            const totalHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

            const { data: updatedLog, error: outError } = await adminSupabase
                .from("attendance_logs")
                .update({
                    clock_out: now.toISOString(),
                    total_hours: totalHours,
                    updated_at: now.toISOString()
                })
                .eq("id", activeLog.id)
                .select()
                .single();

            if (outError) throw outError;

            return NextResponse.json({
                ok: true,
                type: "clock_out",
                log: updatedLog,
                message: `Clocked out successfully. Total hours: ${totalHours}h`
            });
        } else {
            // CLOCK IN
            // We only allow one clock-in per day for now, or multiple if we want history.
            // Let's stick to simple: Create a new log entry.
            const { data: newLog, error: inError } = await adminSupabase
                .from("attendance_logs")
                .insert({
                    tenant_id: employee.tenant_id,
                    employee_id: employee.id,
                    date: today,
                    clock_in: now.toISOString(),
                    status: 'present'
                })
                .select()
                .single();

            if (inError) throw inError;

            return NextResponse.json({
                ok: true,
                type: "clock_in",
                log: newLog,
                message: "Clocked in successfully"
            });
        }

    } catch (err: any) {
        console.error("Attendance clock error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
