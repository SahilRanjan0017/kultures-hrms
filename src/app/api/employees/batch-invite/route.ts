import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { getAppUrl } from "@/lib/utils";

// Generate EMP code like EMP-001, EMP-002
async function generateEmpCode(tenantId: string, adminSupabase: ReturnType<typeof createAdminClient>): Promise<string> {
    const { data: members } = await adminSupabase
        .from("employees")
        .select("emp_code")
        .eq("tenant_id", tenantId)
        .not("emp_code", "is", null);

    const count = (members?.length ?? 0) + 1;
    return `EMP-${String(count).padStart(3, "0")}`;
}

// Generate random temp password
function generateTempPassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

export async function POST(request: NextRequest) {
    try {
        const { employees } = await request.json();

        if (!Array.isArray(employees) || employees.length === 0) {
            return NextResponse.json(
                { ok: false, message: "Valid employees list is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { ok: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const adminSupabase = createAdminClient();

        // Get inviter's tenant and role from employees table (master)
        const { data: inviter } = await adminSupabase
            .from("employees")
            .select("tenant_id, role")
            .eq("user_id", user.id)
            .single();

        if (!inviter || !["admin", "hr"].includes(inviter.role)) {
            return NextResponse.json(
                { ok: false, message: "Only admins and HR can invite members" },
                { status: 403 }
            );
        }

        const { data: tenantData } = await adminSupabase
            .from("tenants")
            .select("name")
            .eq("id", inviter.tenant_id)
            .single();

        const results: any[] = [];
        let currentEmpCount = (await adminSupabase
            .from("employees")
            .select("id")
            .eq("tenant_id", inviter.tenant_id)).data?.length ?? 0;

        for (const emp of employees) {
            try {
                const { email, full_name, role = "employee", department, designation } = emp;

                if (!email || !full_name) {
                    results.push({ email, success: false, error: "Missing name or email" });
                    continue;
                }

                // Check if already in this tenant
                const { data: existingProfiles } = await adminSupabase
                    .from("profiles")
                    .select("id")
                    .eq("email", email.toLowerCase())
                    .eq("tenant_id", inviter.tenant_id);

                if (existingProfiles && existingProfiles.length > 0) {
                    results.push({ email, success: false, error: "Already a member" });
                    continue;
                }

                currentEmpCount++;
                const empCode = `EMP-${String(currentEmpCount).padStart(3, "0")}`;
                const tempPassword = generateTempPassword();

                // Create Auth User
                const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
                    email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name,
                        tenant_id: inviter.tenant_id,
                        role,
                        emp_code: empCode,
                    },
                });

                if (createError) {
                    results.push({ email, success: false, error: createError.message });
                    continue;
                }

                // Insert into employees
                const { data: employeeData, error: employeeError } = await adminSupabase
                    .from("employees")
                    .insert({
                        tenant_id: inviter.tenant_id,
                        full_name,
                        email,
                        emp_code: empCode,
                        role,
                        department,
                        designation,
                        status: "invited",
                        user_id: newUser.user.id
                    })
                    .select("id")
                    .single();

                if (employeeError) {
                    results.push({ email, success: false, error: employeeError.message });
                    continue;
                }

                // Sync to profiles & tenant_members (redundancy for old code path support)
                await adminSupabase.from("profiles").insert({
                    id: newUser.user.id,
                    tenant_id: inviter.tenant_id,
                    full_name,
                    email: email.toLowerCase(),
                    role,
                    is_first_login: true,
                    employee_id: employeeData.id
                });

                await adminSupabase.from("tenant_members").insert({
                    tenant_id: inviter.tenant_id,
                    user_id: newUser.user.id,
                    employee_id: employeeData.id,
                    role,
                    status: "invited",
                    must_change_password: true,
                    invited_by: user.id
                });

                // Send Email
                const loginUrl = `${getAppUrl()}/auth/login`;
                await sendEmail({
                    to: email,
                    subject: `Welcome to ${tenantData?.name ?? "Kultures HRMS"}`,
                    html: `
                        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
                            <h2>Welcome ${full_name}! 👋</h2>
                            <p>Your account has been created on ${tenantData?.name ?? "Kultures HRMS"}.</p>
                            <div style="background:#f4f4f5;padding:20px;border-radius:8px;margin:24px 0;">
                                <p><strong>Employee Code:</strong> ${empCode}</p>
                                <p><strong>Temp Password:</strong> ${tempPassword}</p>
                                <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                            </div>
                            <p style="color:#e53e3e;font-size:12px;">⚠️ You must change your password after first login.</p>
                        </div>
                    `
                });

                results.push({ email, success: true, empCode });

                // Log activity
                await logActivity({
                    tenantId: inviter.tenant_id,
                    actorId: user.id,
                    action: 'EMPLOYEE_CREATE',
                    targetType: 'employee',
                    targetId: employeeData.id,
                    metadata: { email, role, full_name, invited: true }
                });

            } catch (innerErr: any) {
                results.push({ email: emp.email, success: false, error: innerErr.message });
            }
        }

        return NextResponse.json({ ok: true, results });

    } catch (err: any) {
        console.error("→ Batch invite error:", err);
        return NextResponse.json(
            { ok: false, message: err.message },
            { status: 500 }
        );
    }
}
