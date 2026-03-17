import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
    Users,
    CalendarDays,
    DollarSign,
    TrendingUp,
    Clock,
    Plus,
    Download,
    Filter
} from "lucide-react";
import AttendanceWidget from "@/components/dashboard/AttendanceWidget";
import LeaveTracker from "@/components/dashboard/LeaveTracker";
import EmployeeHeader from "@/components/dashboard/EmployeeHeader";
import DashboardSideCalendar from "@/components/dashboard/DashboardSideCalendar";
import HolidayList from "@/components/dashboard/HolidayList";
import DashboardStatusHeader from "@/components/dashboard/DashboardStatusHeader";
import DashboardServiceCards from "@/components/dashboard/DashboardServiceCards";
import StatsCard from "@/components/dashboard/StatsCard";
import EmployeeTracker from "@/components/dashboard/EmployeeTracker";
import UpcomingSchedule from "@/components/dashboard/UpcomingSchedule";
import EmployeeStatusTable from "@/components/dashboard/EmployeeStatusTable";
import Announcements from "@/components/dashboard/Announcements";
import DashboardHeaderActions from "@/components/dashboard/DashboardHeaderActions";

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
        // --- Admin/HR View (Dynamic Mode) ---
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [
            { count: totalEmployeesCount },
            { count: presentToday },
            { count: openLeaves },
            { count: totalLeavesMonth },
            { data: recentEmployees }
        ] = await Promise.all([
            adminSupabase.from("employees").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
            adminSupabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("date", todayDate),
            adminSupabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
            adminSupabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("start_date", `${currentMonth}-01`),
            adminSupabase.from("employees").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(10)
        ]);

        return (
            <div className="space-y-10">
                <DashboardHeaderActions />

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        label="Total Workforce"
                        value={totalEmployeesCount ?? 0}
                        iconType="users"
                        color="blue"
                        trend={{ value: 4.2, isPositive: true }}
                        description="Active employee list"
                    />
                    <StatsCard
                        label="Present Today"
                        value={presentToday ?? 0}
                        iconType="calendar"
                        color="green"
                        trend={{ value: 12, isPositive: true }}
                        description="Attendance compliance"
                    />
                    <StatsCard
                        label="Pending Requests"
                        value={openLeaves ?? 0}
                        iconType="trending"
                        color="yellow"
                        description="Leaves & approvals"
                    />
                    <StatsCard
                        label="Monthly Leaves"
                        value={totalLeavesMonth ?? 0}
                        iconType="clock"
                        color="purple"
                        trend={{ value: 2.1, isPositive: false }}
                        description="Leave frequency"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left & Middle Column (Main Content) */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <EmployeeTracker total={totalEmployeesCount ?? 0} />
                            <Announcements />
                        </div>
                        <EmployeeStatusTable employees={recentEmployees || []} />
                    </div>

                    {/* Right Column (Sidebar Content) */}
                    <div className="lg:col-span-4 space-y-8">
                        <UpcomingSchedule />
                        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm flex flex-col gap-6">
                            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Quick Resources</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: "Company Policy", href: "#" },
                                    { label: "Payroll Calendar", href: "#" },
                                    { label: "Holiday List 2024", href: "#" },
                                ].map((item) => (
                                    <a key={item.label} href={item.href} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100/50 transition-all group">
                                        <span className="text-xs font-bold text-zinc-600 group-hover:text-zinc-900">{item.label}</span>
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Download className="w-3.5 h-3.5 text-zinc-400" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
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
            {/* Status Header (Clock & Attendance) */}
            <DashboardStatusHeader />

            {/* Header with Breadcrumbs/Search if needed elsewhere, but for now matching the image */}
            <EmployeeHeader employee={headerData} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Vertical stack of Payslip, Letters, and Performance cards */}
                    <DashboardServiceCards />

                    {/* Leave Tracker */}
                    <LeaveTracker />
                </div>

                {/* Sidebar Areas */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Calendar Widget */}
                    <DashboardSideCalendar />

                    {/* Holiday List */}
                    <HolidayList />
                </div>
            </div>
        </div>
    );
}
