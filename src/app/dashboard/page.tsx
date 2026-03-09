import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Users,
    CalendarDays,
    DollarSign,
    TrendingUp,
} from "lucide-react";

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

    const STATS = [
        {
            label: "Total Employees",
            value: "0",
            icon: Users,
            color: "bg-blue-50 text-blue-600",
        },
        {
            label: "Present Today",
            value: "0",
            icon: CalendarDays,
            color: "bg-green-50 text-green-600",
        },
        {
            label: "Open Leaves",
            value: "0",
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Add Employee", href: "/dashboard/employees/new" },
                        { label: "Mark Attendance", href: "/dashboard/attendance" },
                        { label: "Approve Leaves", href: "/dashboard/leaves" },
                        { label: "Run Payroll", href: "/dashboard/payroll" },
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

            {/* Coming Soon Modules */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="text-base font-semibold text-zinc-900 mb-4">
                    Modules
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: "👥 Employees", status: "Coming Soon" },
                        { label: "📅 Attendance", status: "Coming Soon" },
                        { label: "🏖️ Leave Management", status: "Coming Soon" },
                        { label: "💰 Payroll", status: "Coming Soon" },
                        { label: "🛡️ Roles & Access", status: "Coming Soon" },
                        { label: "⚙️ Settings", status: "Coming Soon" },
                    ].map((mod) => (
                        <div
                            key={mod.label}
                            className="px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-100"
                        >
                            <p className="text-sm font-medium text-zinc-700">{mod.label}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{mod.status}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
