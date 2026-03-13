import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
    Users,
    CalendarDays,
    DollarSign,
    TrendingUp,
    Clock,
} from "lucide-react";
import AttendanceWidget from "@/components/dashboard/AttendanceWidget";
import LeaveTracker from "@/components/dashboard/LeaveTracker";
import EmployeeHeader from "@/components/dashboard/EmployeeHeader";
import DashboardSideCalendar from "@/components/dashboard/DashboardSideCalendar";
import HolidayList from "@/components/dashboard/HolidayList";
import QuickLinkCard from "@/components/dashboard/QuickLinkCard";

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: membershipRaw } = await supabase
        .from("tenant_members")
        .select(`
            role,
            tenant_id,
            tenants (name, industry, size)
        `)
        .eq("user_id", user.id)
        .single();

    if (!membershipRaw || !membershipRaw.tenant_id) redirect("/onboarding");
    const membershipData = membershipRaw;

    const tenant = Array.isArray(membershipData.tenants)
        ? membershipData.tenants[0]
        : (membershipData.tenants as any);

    const tenantId = membershipData.tenant_id;
    const adminSupabase = createAdminClient();
    const todayDate = new Date().toISOString().split("T")[0];
    const isEmployeeOrManager = membershipData.role === 'employee' || membershipData.role === 'manager';

    // Get current user's employee record with extended info
    const { data: employee } = await adminSupabase
        .from("employees")
        .select(`
            id,
            full_name,
            emp_code,
            designation,
            department,
            location,
            profile_photo_url,
            profile_completion,
            user_id,
            manager:manager_id (
                full_name,
                emp_code
            )
        `)
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .single();

    if (!isEmployeeOrManager) {
        // --- Admin/HR View ---
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [
            { count: totalEmployees },
            { count: presentToday },
            { count: openLeaves },
            { count: totalLeavesMonth }
        ] = await Promise.all([
            adminSupabase.from("employees").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
            adminSupabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("date", todayDate),
            adminSupabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
            adminSupabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("start_date", `${currentMonth}-01`),
        ]);

        const STATS = [
            { label: "Total Employees", value: String(totalEmployees ?? 0), icon: Users, color: "bg-blue-50 text-blue-600" },
            { label: "Present Today", value: String(presentToday ?? 0), icon: CalendarDays, color: "bg-green-50 text-green-600" },
            { label: "Pending Leaves", value: String(openLeaves ?? 0), icon: TrendingUp, color: "bg-yellow-50 text-yellow-600" },
            { label: "Monthly Leaves", value: String(totalLeavesMonth ?? 0), icon: CalendarDays, color: "bg-purple-50 text-purple-600" },
        ];

        return (
            <div className="space-y-8 max-w-[1600px] mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Admin Console</h1>
                        <p className="text-zinc-500 mt-1 font-medium">{tenant.name} · {tenant.industry}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {STATS.map((stat) => (
                                <div key={stat.label} className="bg-white rounded-2xl border border-zinc-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} shadow-inner`}><stat.icon className="w-6 h-6" /></div>
                                    <div>
                                        <p className="text-2xl font-bold text-zinc-900 leading-none mb-1">{stat.value}</p>
                                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm">
                            <h2 className="text-lg font-bold text-zinc-900 mb-6">Quick Actions</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: "Add Employee", href: "/dashboard/employees/new" },
                                    { label: "Run Payroll", href: "/dashboard/payroll" },
                                    { label: "Attendance", href: "/dashboard/attendance" },
                                    { label: "Leaves", href: "/dashboard/leaves" },
                                ].map((action) => (
                                    <a key={action.label} href={action.href} className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-50 bg-zinc-50/30 text-xs font-bold text-zinc-600 hover:bg-white hover:border-primary/20 hover:text-primary transition-all shadow-sm hover:shadow-md">{action.label}</a>
                                ))}
                            </div>
                        </div>
                        <LeaveTracker />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <AttendanceWidget />
                    </div>
                </div>
            </div>
        );
    }

    // --- Premium Employee/Manager View ---
    const headerData = {
        full_name: employee?.full_name || user.user_metadata?.full_name || 'Team Member',
        emp_code: employee?.emp_code || 'EMP-000',
        designation: employee?.designation || 'Associate',
        department: employee?.department || 'Operations',
        location: employee?.location || 'Headquarters',
        email: user.email || '',
        manager_name: (employee?.manager as any)?.full_name,
        manager_code: (employee?.manager as any)?.emp_code,
        profile_completion: employee?.profile_completion || 75,
        profile_photo_url: employee?.profile_photo_url,
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header with Breadcrumbs/Search if needed elsewhere, but for now matching the image */}
            <EmployeeHeader employee={headerData} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Organogram & Handbook Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickLinkCard type="organogram" />
                        <QuickLinkCard type="handbook" />
                    </div>

                    {/* Leave Tracker */}
                    <LeaveTracker />
                </div>

                {/* Sidebar Areas */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Calendar Widget */}
                    <DashboardSideCalendar />

                    {/* Holiday List */}
                    <HolidayList />

                    {/* Attendance Widget (Kept for functionality) */}
                    <AttendanceWidget />
                </div>
            </div>
        </div>
    );
}
