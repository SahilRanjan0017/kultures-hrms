import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

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
        const { email, role, name } = await request.json();

        if (!email || !role || !name) {
            return NextResponse.json(
                { ok: false, message: "Name, email and role are required" },
                { status: 400 }
            );
        }

        const validRoles = ["admin", "hr", "manager", "employee"];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { ok: false, message: "Invalid role" },
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

        // Get inviter's tenant
        const { data: membership } = await adminSupabase
            .from("tenant_members")
            .select("tenant_id, role, tenants(name)")
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { ok: false, message: "Tenant not found" },
                { status: 404 }
            );
        }

        if (!["admin", "hr"].includes(membership.role)) {
            return NextResponse.json(
                { ok: false, message: "Only admins and HR can invite members" },
                { status: 403 }
            );
        }

        const tenant = Array.isArray(membership.tenants)
            ? membership.tenants[0]
            : (membership.tenants as { name: string });

        // Check if already in this tenant
        const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
        const existingUser = authUsers?.users?.find(u => u.email === email);

        if (existingUser) {
            const { data: alreadyMember } = await adminSupabase
                .from("tenant_members")
                .select("id")
                .eq("tenant_id", membership.tenant_id)
                .eq("user_id", existingUser.id)
                .single();

            if (alreadyMember) {
                return NextResponse.json(
                    { ok: false, message: "This person is already in your team" },
                    { status: 400 }
                );
            }
        }

        // Auto-generate EMP code and temp password
        const empCode = await generateEmpCode(membership.tenant_id, adminSupabase);
        const tempPassword = generateTempPassword();

        console.log("→ Generated EMP code:", empCode);
        console.log("→ Creating user:", email);

        // Create user in Supabase auth
        const { data: newUser, error: createError } = await adminSupabase
            .auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: name,
                    tenant_id: membership.tenant_id,
                    role,
                    emp_code: empCode,
                },
            });

        if (createError) {
            console.error("→ Create user error:", createError.message);
            return NextResponse.json(
                { ok: false, message: createError.message },
                { status: 400 }
            );
        }

        console.log("→ User created:", newUser.user.id);

        // Insert into employees
        const { data: employeeData, error: employeeError } = await adminSupabase
            .from("employees")
            .insert({
                tenant_id: membership.tenant_id,
                full_name: name,
                email: email,
                emp_code: empCode,
                role: role,
                status: "invited",
                user_id: newUser.user.id
            })
            .select("id")
            .single();

        if (employeeError) {
            console.error("→ Employee insert error:", employeeError.message);
            return NextResponse.json(
                { ok: false, message: employeeError.message },
                { status: 400 }
            );
        }

        // Add to tenant_members
        const { error: memberError } = await adminSupabase
            .from("tenant_members")
            .insert({
                tenant_id: membership.tenant_id,
                user_id: newUser.user.id,
                employee_id: employeeData.id,
                role,
                status: "invited",
                must_change_password: true,
                invited_by: user.id
            });

        // Add to profiles
        const { error: profileUpdateError } = await adminSupabase
            .from("profiles")
            .update({
                tenant_id: membership.tenant_id,
                role,
                is_first_login: true,
                employee_id: employeeData.id,
            })
            .eq("id", newUser.user.id);

        if (profileUpdateError) {
            console.error("→ Profile update error after invite:", profileUpdateError.message);
        }

        if (memberError) {
            console.error("→ Member insert error:", memberError.message);
            return NextResponse.json(
                { ok: false, message: memberError.message },
                { status: 400 }
            );
        }

        // Send credentials email
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;

        try {
            await sendEmail({
                to: email,
                subject: `Your login credentials for ${tenant?.name ?? "Kultures HRMS"}`,
                html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="color:#111;margin-bottom:4px;">
              Welcome to ${tenant?.name ?? "Kultures HRMS"} 👋
            </h2>
            <p style="color:#555;margin-bottom:24px;">
              Hi ${name}, your account has been created. 
              Use the credentials below to login.
            </p>

            <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;width:130px;">Login URL</td>
                  <td style="padding:8px 0;font-size:13px;">
                    <a href="${loginUrl}" style="color:#2563eb;">${loginUrl}</a>
                  </td>
                </tr>
                <tr style="background:#fff8e1;">
                  <td style="padding:10px 8px;color:#888;font-size:13px;font-weight:600;">
                    Employee Code
                  </td>
                  <td style="padding:10px 8px;font-size:16px;font-weight:700;color:#111;
                             letter-spacing:2px;">
                    ${empCode}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Password</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;">${tempPassword}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#888;font-size:13px;">Role</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;text-transform:capitalize;">
                    ${role}
                  </td>
                </tr>
              </table>
            </div>

            <a href="${loginUrl}"
               style="display:inline-block;background:#111;color:#fff;padding:12px 24px;
                      border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              Login to Dashboard →
            </a>

            <p style="color:#e53e3e;font-size:12px;margin-top:16px;font-weight:600;">
              ⚠️ You must set a new password after first login.
            </p>
            <p style="color:#aaa;font-size:12px;margin-top:8px;">
              Keep your Employee Code safe — you will need it to login every time.
            </p>
          </div>
        `,
            });
            console.log("→ Credentials email sent to:", email);
        } catch (emailErr) {
            console.error("→ Email send error:", emailErr);
        }

        return NextResponse.json({ ok: true, empCode });

    } catch (err) {
        console.error("→ Unexpected error:", err);
        return NextResponse.json(
            { ok: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
