import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { RoleProvider } from "@/lib/role-context";
import { type Role } from "@/lib/permissions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: membership } = await supabase
        .from("tenant_members")
        .select("role, tenant_id, tenants(id, name)")
        .eq("user_id", user.id)
        .single();

    if (!membership || !membership.tenant_id) redirect("/onboarding");

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
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </RoleProvider>
    );
}
