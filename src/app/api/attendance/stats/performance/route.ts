import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, subDays, format, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminSupabase = createAdminClient();

        // Resolve tenant
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const today = new Date();
        const yesterday = subDays(today, 1);

        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

        // Fetch logs for today and yesterday
        const { data: logs, error: logsError } = await adminSupabase
            .from('attendance_logs')
            .select('clock_in, date, employee_id')
            .eq('tenant_id', profile.tenant_id)
            .in('date', [todayStr, yesterdayStr]);

        if (logsError) throw logsError;

        // Fetch total employees
        const { count: totalEmployees } = await adminSupabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'active');

        const activeCount = totalEmployees || 1; // Avoid division by zero

        // Group by hour and day
        const hourlyStats = [9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => {
            const timeLabel = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

            const todayLogs = logs?.filter(l => l.date === todayStr && new Date(l.clock_in).getHours() <= hour) || [];
            const yesterdayLogs = logs?.filter(l => l.date === yesterdayStr && new Date(l.clock_in).getHours() <= hour) || [];

            return {
                time: timeLabel,
                today: Math.round((todayLogs.length / activeCount) * 100),
                yesterday: Math.round((yesterdayLogs.length / activeCount) * 100)
            };
        });

        const todayAvg = hourlyStats.length > 0
            ? Math.round(hourlyStats.reduce((acc, curr) => acc + curr.today, 0) / hourlyStats.length)
            : 0;

        return NextResponse.json({
            ok: true,
            performance: hourlyStats,
            summary: {
                totalEmployees: totalEmployees || 0,
                presentToday: new Set(logs?.filter(l => l.date === todayStr).map(l => l.employee_id)).size,
                presentYesterday: new Set(logs?.filter(l => l.date === yesterdayStr).map(l => l.employee_id)).size,
                averageToday: todayAvg
            }
        });

    } catch (err: any) {
        console.error("Performance API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
