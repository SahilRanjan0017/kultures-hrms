import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
    Users,
    CalendarDays,
    DollarSign,
    TrendingUp,
} from "lucide-react";
import AttendanceWidget from "@/components/dashboard/AttendanceWidget";
import LeaveTracker from "@/components/dashboard/LeaveTracker";

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: membership } = await supabase
        .from("tenant_members")
        .select("role, tenant_id, tenants(name, industry, size)")
        .eq("user_id", user.id)
        .single();

    if (!membership || !membership.tenant_id) redirect("/onboarding");

    const tenant = Array.isArray(membership.tenants)
        ? membership.tenants[0]
        : (membership.tenants as { name: string; industry: string; size: string });

    if (!tenant) redirect("/onboarding");

    const tenantId = membership.tenant_id;
    const adminSupabase = createAdminClient();
    const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all metrics in parallel
    const [
        { count: totalEmployees },
        { count: presentToday },
        { count: openLeaves },
    ] = await Promise.all([
        // Total active employees in this tenant
        adminSupabase
            .from("employees")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("status", "active"),

        // Present today: attendance_logs with today's date for this tenant's employees
        adminSupabase
            .from("attendance_logs")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("date", todayDate),

        // Open (pending) leave requests for this tenant
        adminSupabase
            .from("leave_requests")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("status", "pending"),
    ]);

    const STATS = [
        {
            label: "Total Employees",
            value: String(totalEmployees ?? 0),
            icon: Users,
            color: "bg-blue-50 text-blue-600",
        },
        {
            label: "Present Today",
            value: String(presentToday ?? 0),
            icon: CalendarDays,
            color: "bg-green-50 text-green-600",
        },
        {
            label: "Open Leaves",
            value: String(openLeaves ?? 0),
            icon: TrendingUp,
            color: "bg-yellow-50 text-yellow-600",
        },
        {
            label: "Payroll Due",
            value: "₹0",
            icon: DollarSign,
            color: "bg-purple-50 text-purple-600",
        },
    ];

    return (
        <div className="space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                    Welcome back 👋
                </h1>
                <p className="text-zinc-500 mt-1">
                    {tenant.name} · {tenant.industry} · {tenant.size}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {STATS.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-xl border border-zinc-200 p-6 flex items-center gap-4"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                                        <p className="text-sm text-zinc-500">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="text-base font-semibold text-zinc-900 mb-4">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Add Employee", href: "/dashboard/employees/new" },
                                { label: "View Directory", href: "/dashboard/employees" },
                                { label: "Attendance Logs", href: "/dashboard/attendance" },
                                { label: "Leave Requests", href: "/dashboard/leaves" },
                            ].map((action) => (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className="text-center px-4 py-3 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                                >
                                    {action.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Leave Tracker Widget */}
                    <LeaveTracker />
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <AttendanceWidget />
                </div>
            </div>

            {/* Modules Grid */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="text-base font-semibold text-zinc-900 mb-4">
                    Modules
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: "👥 Employees", status: "Active", href: "/dashboard/employees" },
                        { label: "📅 Attendance", status: "Active", href: "/dashboard/attendance" },
                        { label: "🏖️ Leave Management", status: "Active", href: "/dashboard/leaves" },
                        { label: "💰 Payroll", status: "Coming Soon", href: "#" },
                        { label: "🛡️ Roles & Access", status: "Coming Soon", href: "#" },
                        { label: "⚙️ Settings", status: "Coming Soon", href: "/dashboard/settings" },
                    ].map((mod) => (
                        <a
                            key={mod.label}
                            href={mod.href}
                            className={`px-4 py-3 rounded-lg border transition-all ${mod.status === 'Active' ? 'bg-zinc-50 border-zinc-200 hover:border-primary/50' : 'bg-zinc-50/50 border-zinc-100 opacity-60 cursor-not-allowed'}`}
                        >
                            <p className="text-sm font-medium text-zinc-700">{mod.label}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{mod.status}</p>
                        </a>
                    ))}
                </div>
            </div>

        </div>
    );
}
