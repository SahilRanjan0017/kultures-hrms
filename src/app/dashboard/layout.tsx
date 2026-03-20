"use client";

import { createClient } from "@/lib/supabase/client";
import { redirect, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { RoleProvider } from "@/lib/role-context";
import { type Role } from "@/lib/permissions";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, User, Plus } from "lucide-react";

import { HeaderProvider, useHeader } from "@/lib/header-context";

function DashboardNavbar({ user, membership }: { user: any, membership: any }) {
    const pathname = usePathname();
    const { actions, title } = useHeader();

    return (
        <header className="h-24 bg-white border-b border-zinc-100 flex items-center justify-between px-10 shrink-0 sticky top-0 z-40">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    {title ? title : (
                        <>Welcome back, <span className="text-indigo-600">{user.email?.split('@')[0] || 'User'}!</span></>
                    )}
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                    <span>Home</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-200" />
                    <span>Dashboard</span>
                    {pathname !== "/dashboard" && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-zinc-900 italic capitalize">{pathname.split('/').pop()}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Dynamic Page Specific Actions */}
                {actions.length > 0 && (
                    <div className="flex items-center gap-3 mr-6 pr-6 border-r border-zinc-100">
                        {actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={action.onClick}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${action.variant === 'outline'
                                    ? "bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                    }`}
                            >
                                {action.icon && <action.icon className="w-4 h-4" />}
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 mr-4">
                        <button className="p-2.5 bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                            <Search className="w-4 h-4" />
                        </button>
                        <div className="relative">
                            <NotificationBell />
                        </div>
                    </div>

                    <Link href="/dashboard/profile" className="flex items-center gap-3 group">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-zinc-900 leading-none">{user.email?.split('@')[0]}</p>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{membership.role}</p>
                        </div>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100 shadow-sm transition-transform group-hover:scale-105">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [membership, setMembership] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/auth/login";
                return;
            }
            setUser(user);

            // 1. Try to get membership from tenant_members
            const { data: membership, error: memberError } = await supabase
                .from("tenant_members")
                .select("role, tenant_id, tenants(id, name, logo_url)")
                .eq("user_id", user.id)
                .single();

            // 2. Fallback to profiles if needed
            if (!membership || !membership.tenant_id) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("tenant_id, role")
                    .eq("id", user.id)
                    .single();

                if (profile?.tenant_id) {
                    setMembership({
                        role: profile.role,
                        tenant_id: profile.tenant_id,
                        tenants: { id: profile.tenant_id, name: "Loading..." }
                    });
                    setLoading(false);
                    return;
                }
                window.location.href = "/onboarding";
                return;
            }

            setMembership(membership);
            setLoading(false);
        }
        load();

        // ✅ Enterprise "Heartbeat" — keeps session fresh during idle periods
        const heartbeat = setInterval(async () => {
            console.log("→ [AUTH] Heartbeat triggered at:", new Date().toLocaleTimeString());
            // Consolidate: Just hit the heartbeat API which checks session on server
            // This also helps keep the Vercel/Server session active
            await fetch('/api/auth/heartbeat').catch(() => { });
        }, 10 * 60 * 1000); // 10 minutes (standard for Supabase sessions)

        // ✅ Check 8: Tab Focus Refresh
        const onFocus = () => {
            console.log("→ [AUTH] Tab focus refresh triggered at:", new Date().toLocaleTimeString());
            const supabase = createClient();
            supabase.auth.getUser();
        };
        window.addEventListener("focus", onFocus);

        return () => {
            clearInterval(heartbeat);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-zinc-400 animate-pulse uppercase tracking-widest">Initialising Dashboard</p>
        </div>
    );

    const tenant = Array.isArray(membership.tenants)
        ? membership.tenants[0]
        : (membership.tenants as { id: string; name: string; logo_url?: string });

    return (
        <RoleProvider role={membership.role as Role}>
            <HeaderProvider>
                <div className="flex h-screen bg-[#FDFDFF] overflow-hidden font-sans antialiased text-zinc-900">
                    <Sidebar
                        tenantId={tenant?.id}
                        tenantName={tenant?.name ?? "Your Company"}
                        logoUrl={tenant?.logo_url}
                        userEmail={user.email ?? ""}
                        userRole={membership.role}
                    />
                    <main className="flex-1 overflow-y-auto relative flex flex-col bg-[#F9FAFB]/50">
                        <DashboardNavbar user={user} membership={membership} />

                        {/* Content Area */}
                        <div className="p-10 flex-1">
                            <div className="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </HeaderProvider>
        </RoleProvider>
    );
}
