import { createAdminClient } from "./supabase/admin";
import { SupabaseClient } from "@supabase/supabase-js";

export async function syncUserSession(userId: string, email: string, supabase: SupabaseClient) {
    const adminSupabase = createAdminClient();

    console.log(`→ Syncing session for ${email} (${userId})...`);

    // 1. Find employee record by email or user_id
    const { data: employeeData, error: employeeError } = await adminSupabase
        .from("employees")
        .select("id, tenant_id, role, user_id")
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
            onboarding_completed: role === "employee", // ✅ Employees skip additional onboarding
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

    // 4. Update employee record with user_id & status if invited
    const updateData: any = {};
    if (!employeeData.user_id) updateData.user_id = userId;

    // Always ensure status is 'active' upon successful sync/login
    updateData.status = 'active';

    const { error: empUpdateError } = await adminSupabase
        .from("employees")
        .update(updateData)
        .eq("id", employeeId);

    if (empUpdateError) {
        console.error("→ [SYNC] Employee update error:", empUpdateError.message);
    } else {
        console.log(`→ [SYNC] Updated employee ${employeeId}: user linked and status set to active`);
    }

    console.log(`→ [SYNC] Sync complete for ${email}. Result:`, !!profileData);
    return profileData;
}
