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
    Camera,
    Loader2,
    MapIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Role, Permission } from "@/lib/permissions";

const ALL_NAV_ITEMS: {
    label: string;
    href: string;
    icon: React.ElementType;
    permission: Permission | null;
    section?: string;
}[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            permission: null,
            section: "MAIN",
        },
        {
            label: "Team",
            href: "/dashboard/team",
            icon: UserPlus,
            permission: "team:view",
            section: "TEAM",
        },
        {
            label: "Employees",
            href: "/dashboard/employees",
            icon: Users,
            permission: "employees:view",
            section: "TEAM",
        },
        {
            label: "Attendance",
            href: "/dashboard/attendance",
            icon: CalendarDays,
            permission: "attendance:own",
            section: "OPERATIONS",
        },
        {
            label: "Tracking",
            href: "/dashboard/tracking",
            icon: MapIcon,
            permission: "attendance:view",
            section: "OPERATIONS",
        },
        {
            label: "Calendar",
            href: "/dashboard/calendar",
            icon: CalendarDays,
            permission: "calendar:view",
            section: "OPERATIONS",
        },
        {
            label: "Leaves",
            href: "/dashboard/leaves",
            icon: Building2,
            permission: "leaves:own",
            section: "OPERATIONS",
        },
        {
            label: "Payroll",
            href: "/dashboard/payroll",
            icon: DollarSign,
            permission: "payroll:own",
            section: "OPERATIONS",
        },
        {
            label: "Documents",
            href: "/dashboard/documents",
            icon: ShieldCheck,
            permission: "documents:view",
            section: "OPERATIONS",
        },
        {
            label: "Roles",
            href: "/dashboard/roles",
            icon: ShieldCheck,
            permission: "roles:manage",
            section: "ADMIN",
        },
        {
            label: "Activity",
            href: "/dashboard/activity",
            icon: History,
            permission: "settings:manage",
            section: "ADMIN",
        },
        {
            label: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            permission: "settings:manage",
            section: "ADMIN",
        },
    ];

interface SidebarProps {
    tenantId: string;
    tenantName: string;
    logoUrl?: string;
    userEmail: string;
    userRole: string;
}

export default function Sidebar({
    tenantId,
    tenantName,
    logoUrl: initialLogoUrl,
    userEmail,
    userRole,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
    const [uploading, setUploading] = useState(false);

    const isAdmin = userRole === 'admin' || userRole === 'hr';

    const filteredItems = ALL_NAV_ITEMS.filter((item) => {
        if (!item.permission) return true;
        return hasPermission(userRole as Role, item.permission);
    });

    const sections = Array.from(new Set(filteredItems.map(item => item.section || "OTHER")));

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    }

    async function handleLogoClick() {
        if (isAdmin) {
            fileInputRef.current?.click();
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/tenant/logo", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setLogoUrl(data.logoUrl);
            router.refresh();
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            alert(`Failed to update logo: ${error.message}`);
        } finally {
            setUploading(false);
        }
    }

    return (
        <aside className="w-64 bg-white border-r border-zinc-100 flex flex-col h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Logo + Company */}
            <div className="px-6 py-8">
                <div
                    onClick={handleLogoClick}
                    className={`flex items-center gap-3 group px-1 ${isAdmin ? 'cursor-pointer' : ''}`}
                >
                    <div className="relative w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-105 transition-all duration-300 overflow-hidden">
                        {uploading ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : logoUrl ? (
                            <img src={logoUrl} alt={tenantName} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-5 h-5 text-white" />
                        )}

                        {isAdmin && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 leading-tight truncate max-w-[140px] tracking-tight">
                            {tenantName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{userRole}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto no-scrollbar">
                {sections.map(section => (
                    <div key={section} className="space-y-2">
                        <h3 className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3">{section}</h3>
                        <div className="space-y-1">
                            {filteredItems.filter(item => item.section === section).map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                                            ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50"
                                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                                            }`}
                                    >
                                        <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? "text-indigo-600" : "text-zinc-400 group-hover:text-zinc-900"}`} />
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="p-4 border-t border-zinc-50 bg-zinc-50/30">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 border-2 border-white shadow-sm ring-1 ring-zinc-100 uppercase overflow-hidden text-center shrink-0">
                            {userEmail?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate">{userEmail.split('@')[0]}</p>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{userEmail}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 border border-transparent hover:border-rose-100"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout Session
                    </button>
                </div>
            </div>

        </aside>
    );
}
