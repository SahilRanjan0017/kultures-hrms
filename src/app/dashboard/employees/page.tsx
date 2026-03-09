import { createClient } from "@/lib/supabase/server";
import { getEmployees } from "@/lib/employees";
import EmployeeTable from "@/components/employees/EmployeeTable";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import Link from "next/link";

export default async function EmployeesPage() {
    const supabase = await createClient();  // ← add await here

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null; // ← safety check

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)  // ← remove ! operator
        .single();

    if (!profile) return null; // ← safety check

    const employees = await getEmployees(profile.tenant_id);
    const canManage = hasPermission(profile.role as Role, "employees:manage");

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Employees</h1>
                    <p className="text-sm text-zinc-500">
                        {employees.length} total employees
                    </p>
                </div>
                {canManage && (
                    <Link
                        href="/dashboard/employees/new"
                        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 transition"
                    >
                        + Add Employee
                    </Link>
                )}
            </div>

            <EmployeeTable employees={employees} canManage={canManage} />
        </div>
    );
}
