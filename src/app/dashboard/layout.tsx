"use client";

import { createClient } from "@/lib/supabase/client";
import { redirect, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { RoleProvider } from "@/lib/role-context";
import { type Role } from "@/lib/permissions";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useEffect, useState } from "react";
import Link from "next/link";

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

            const { data: membership } = await supabase
                .from("tenant_members")
                .select("role, tenant_id, tenants(id, name)")
                .eq("user_id", user.id)
                .single();

            if (!membership || !membership.tenant_id) {
                window.location.href = "/onboarding";
                return;
            }
            setMembership(membership);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-medium animate-pulse text-zinc-400">Loading Dashboard...</div>;

    const tenant = Array.isArray(membership.tenants)
        ? membership.tenants[0]
        : (membership.tenants as { id: string; name: string });

    return (
        <RoleProvider role={membership.role as Role}>
            <div className="flex h-screen bg-zinc-50 overflow-hidden">
                <Sidebar
                    tenantName={tenant?.name ?? "Your Company"}
                    userEmail={user.email ?? ""}
                    userRole={membership.role}
                />
                <main className="flex-1 overflow-y-auto">
                    {/* Dashboard Top Header */}
                    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 shrink-0">
                        <div className="flex items-center gap-4">
                            <h1 className="text-sm font-semibold text-zinc-500 capitalize">{pathname.split('/').pop() || 'Dashboard'}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <div className="w-px h-6 bg-zinc-200 mx-1" />
                            <Link href="/dashboard/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 border border-zinc-200 uppercase">
                                    {user.email?.[0]}
                                </div>
                            </Link>
                        </div>
                    </header>

                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </RoleProvider>
    );
}
