import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InviteForm from "@/components/dashboard/InviteForm";
import RoleGuard from "@/components/dashboard/RoleGuard";
import { type Role } from "@/lib/permissions";

import TeamHeaderActions from "@/components/dashboard/TeamHeaderActions";

export default async function TeamPage() {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) redirect("/auth/login");

    const { data: membership } = await supabase
        .from("tenant_members")
        .select("role, tenant_id")
        .eq("user_id", user.id)
        .single();

    if (!membership || !membership.tenant_id) redirect("/onboarding");

    const { data: members } = await supabase
        .from("tenant_members")
        .select(`
            id, role, status, created_at,
            employee:employees(emp_code, full_name)
        `)
        .eq("tenant_id", membership.tenant_id)
        .order("created_at", { ascending: false });

    // Transform to flat structure for the UI
    const transformedMembers = members?.map(m => ({
        ...m,
        emp_code: Array.isArray(m.employee) ? m.employee[0]?.emp_code : (m.employee as any)?.emp_code,
        full_name: Array.isArray(m.employee) ? m.employee[0]?.full_name : (m.employee as any)?.full_name
    }));

    return (
        <RoleGuard role={membership.role as Role} permission="team:view">
            <div className="space-y-10 pb-12">
                <TeamHeaderActions count={members?.length ?? 0} />

                {/* Invite Form — admin/hr only */}
                <RoleGuard
                    role={membership.role as Role}
                    permission="team:invite"
                    fallback={null}
                >
                    <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-zinc-900 tracking-tight mb-6">
                            Invite New Member
                        </h2>
                        <InviteForm />
                    </div>
                </RoleGuard>

                {/* Members List */}
                <div className="bg-white rounded-[2.5rem] border border-zinc-100/50 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                                Organization Members
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Directory of all users</p>
                        </div>
                    </div>

                    <div className="divide-y divide-zinc-100">
                        {transformedMembers?.map((member) => (
                            <div
                                key={member.id}
                                className="px-6 py-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-600">
                                        {member.emp_code?.slice(-2) ?? "??"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">
                                            {member.full_name || member.emp_code || "—"}
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                            {member.emp_code} • Joined {new Date(member.created_at).toLocaleDateString("en-IN")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.status === "invited"
                                        ? "bg-yellow-50 text-yellow-700"
                                        : "bg-green-50 text-green-700"
                                        }`}>
                                        {member.status === "invited" ? "Pending" : "Active"}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-700 font-medium capitalize">
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {(!transformedMembers || transformedMembers.length === 0) && (
                            <div className="px-6 py-8 text-center text-zinc-400 text-sm">
                                No team members yet. Invite your first member above.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </RoleGuard>
    );
}
