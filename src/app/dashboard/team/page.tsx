import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InviteForm from "@/components/dashboard/InviteForm";
import RoleGuard from "@/components/dashboard/RoleGuard";
import { type Role } from "@/lib/permissions";

export default async function TeamPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: membership } = await supabase
        .from("tenant_members")
        .select("role, tenant_id")
        .eq("user_id", user.id)
        .single();

    if (!membership || !membership.tenant_id) redirect("/onboarding");

    const { data: members } = await supabase
        .from("tenant_members")
        .select("id, role, status, created_at, emp_code")
        .eq("tenant_id", membership.tenant_id)
        .order("created_at", { ascending: false });

    return (
        <RoleGuard role={membership.role as Role} permission="team:view">
            <div className="space-y-8">

                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Team Members</h1>
                    <p className="text-zinc-500 mt-1">Manage your team and their roles</p>
                </div>

                {/* Invite Form — admin/hr only */}
                <RoleGuard
                    role={membership.role as Role}
                    permission="team:invite"
                    fallback={null}
                >
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="text-base font-semibold text-zinc-900 mb-4">
                            Invite New Member
                        </h2>
                        <InviteForm />
                    </div>
                </RoleGuard>

                {/* Members List */}
                <div className="bg-white rounded-xl border border-zinc-200">
                    <div className="px-6 py-4 border-b border-zinc-200">
                        <h2 className="text-base font-semibold text-zinc-900">
                            All Members ({members?.length ?? 0})
                        </h2>
                    </div>

                    <div className="divide-y divide-zinc-100">
                        {members?.map((member) => (
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
                                            {member.emp_code ?? "—"}
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                            Joined {new Date(member.created_at).toLocaleDateString("en-IN")}
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

                        {(!members || members.length === 0) && (
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
