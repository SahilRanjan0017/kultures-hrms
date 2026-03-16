import { createAdminClient } from "./supabase/admin";
import { SupabaseClient } from "@supabase/supabase-js";

export async function syncUserSession(userId: string, email: string, supabase: SupabaseClient) {
    const adminSupabase = createAdminClient();

    console.log(`→ Syncing session for ${email} (${userId})...`);

    // 1. Find employee record by email or user_id
    const { data: employeeData, error: employeeError } = await adminSupabase
        .from("employees")
        .select("id, tenant_id, role")
        .eq("email", email)
        .single();

    if (employeeError || !employeeData) {
        console.log("→ No matching employee record found for sync.");
        return null;
    }

    const { id: employeeId, tenant_id: tenantId, role } = employeeData;

    if (!tenantId) {
        console.log("→ Employee record exists but has no tenant_id.");
        return null;
    }

    // 2. Update profiles
    const { data: profileData, error: profileError } = await adminSupabase
        .from("profiles")
        .upsert({
            id: userId,
            tenant_id: tenantId,
            employee_id: employeeId,
            role: role,
            email: email,
            is_first_login: false // Assuming if they are in employees, they've been handled
        })
        .select()
        .single();

    if (profileError) {
        console.error("→ Profile sync error:", profileError.message);
    }

    // 3. Update/Insert tenant_members
    const { error: memberError } = await adminSupabase
        .from("tenant_members")
        .upsert({
            tenant_id: tenantId,
            user_id: userId,
            employee_id: employeeId,
            role: role,
            status: "active"
        }, {
            onConflict: 'user_id, tenant_id'
        });

    if (memberError) {
        console.error("→ [SYNC] Membership sync error:", memberError.message);
    }

    console.log(`→ [SYNC] Sync complete for ${email}. Result:`, !!profileData);
    return profileData;
}
