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
            await fetch('/api/auth/heartbeat').catch(() => { });
        }, 10 * 60 * 1000); // 10 minutes

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

    if (loading) return <div>Loading...</div>;

    // ... layout content ...
}
