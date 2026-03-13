"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    DollarSign,
    Settings,
    LogOut,
    Building2,
    ShieldCheck,
    UserPlus,
    Bell,
    History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import type { Role, Permission } from "@/lib/permissions";

const ALL_NAV_ITEMS: {
    label: string;
    href: string;
    icon: React.ElementType;
    permission: Permission | null;
}[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            permission: null,
        },
        {
            label: "Team",
            href: "/dashboard/team",
            icon: UserPlus,
            permission: "team:view",
        },
        {
            label: "Employees",
            href: "/dashboard/employees",
            icon: Users,
            permission: "employees:view",
        },
        {
            label: "Attendance",
            href: "/dashboard/attendance",
            icon: CalendarDays,
            permission: "attendance:own",
        },
        {
            label: "Payroll",
            href: "/dashboard/payroll",
            icon: DollarSign,
            permission: "payroll:own",
        },
        {
            label: "Roles",
            href: "/dashboard/roles",
            icon: ShieldCheck,
            permission: "roles:manage",
        },
        {
            label: "Activity",
            href: "/dashboard/activity",
            icon: History,
            permission: "settings:manage", // Admin/HR
        },
        {
            label: "Notifications",
            href: "/dashboard/notifications",
            icon: Bell,
            permission: null,
        },
        {
            label: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            permission: "settings:manage",
        },
    ];

interface SidebarProps {
    tenantName: string;
    userEmail: string;
    userRole: string;
}

export default function Sidebar({
    tenantName,
    userEmail,
    userRole,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = ALL_NAV_ITEMS.filter((item) => {
        if (!item.permission) return true;
        return hasPermission(userRole as Role, item.permission);
    });

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    }

    return (
        <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-full shrink-0">

            {/* Logo + Company */}
            <div className="px-6 py-5 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-zinc-900 leading-tight truncate max-w-[140px]">
                            {tenantName}
                        </p>
                        <p className="text-xs text-zinc-400 capitalize">{userRole}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div className="px-3 py-4 border-t border-zinc-200 space-y-1">
                <div className="px-3 py-2">
                    <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Logout
                </button>
            </div>

        </aside>
    );
}
