// ============================================
// USE THIS IN: Server Components (pages)
// ============================================
import { createClient as createServerClient } from "@/lib/supabase/server";

// ============================================
// USE THIS IN: Client Components (forms)
// ============================================
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export type Employee = {
    id: string;
    full_name: string;
    email: string;
    emp_code: string;
    role: string;
    department: string | null;
    designation: string | null;
    phone: string | null;
    date_of_joining: string | null;
    status: "active" | "inactive";
    avatar_url: string | null;
};

// ✅ SERVER — used in page.tsx (async server component)
export async function getEmployees(tenantId: string): Promise<Employee[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}

// ✅ SERVER — used in [id]/page.tsx
export async function getEmployeeById(id: string): Promise<Employee | null> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
}

// ✅ CLIENT — used in EmployeeForm.tsx (client component)
export async function createEmployee(
    payload: Omit<Employee, "id"> & { tenant_id: string }
) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from("employees")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ✅ CLIENT — used in EmployeeForm.tsx (client component)
export async function updateEmployee(id: string, payload: Partial<Employee>) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from("employees")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ✅ CLIENT — used in EmployeeTable.tsx (client component)
export async function deactivateEmployee(id: string) {
    return updateEmployee(id, { status: "inactive" });
}
