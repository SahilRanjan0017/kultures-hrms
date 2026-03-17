import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

export async function POST(request: NextRequest) {
    try {
        const { companyName, industry, size } = await request.json();

        if (!companyName || !industry || !size) {
            return NextResponse.json(
                { ok: false, message: "All fields are required" },
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

        // ✅ Step 0: Check if they are ALREADY an admin of a tenant
        const { data: existingProfile } = await adminSupabase
            .from("profiles")
            .select("tenant_id, role")
            .eq("id", user.id)
            .single();

        if (existingProfile?.tenant_id && existingProfile.role === 'admin') {
            console.log("→ User is already an admin of a tenant, skipping creation");
            return NextResponse.json({ ok: true, alreadyExists: true });
        }

        console.log("→ Creating new tenant for user:", user.email);
        const slug = `${generateSlug(companyName)}-${Date.now()}`;

        // Step 1 — Create tenant
        const { data: tenant, error: tenantError } = await adminSupabase
            .from("tenants")
            .insert({ name: companyName, slug, industry, size })
            .select()
            .single();

        if (tenantError) {
            console.error("→ Tenant creation error:", tenantError.message);
            return NextResponse.json(
                { ok: false, message: tenantError.message },
                { status: 400 }
            );
        }

        const empCode = "EMP-001";

        // Step 2 — ✅ Upsert founder into employees (use user_id as unique key)
        const { data: employeeData, error: employeeError } = await adminSupabase
            .from("employees")
            .upsert({
                tenant_id: tenant.id,
                full_name: user?.user_metadata?.full_name || user.email?.split("@")[0] || "Admin",
                email: user.email,
                emp_code: empCode,
                role: "admin",
                status: "active",
                user_id: user.id
            }, { onConflict: 'user_id' })
            .select("id")
            .single();

        if (employeeError) {
            console.error("→ Employee upsert error:", employeeError.message);
        }

        const employeeId = employeeData?.id || null;

        // Step 3 — ✅ Update profiles
        await adminSupabase
            .from("profiles")
            .update({
                tenant_id: tenant.id,
                role: "admin",
                employee_id: employeeId,
            })
            .eq("id", user.id);

        // Step 4 — ✅ Upsert into tenant_members
        await adminSupabase
            .from("tenant_members")
            .upsert({
                tenant_id: tenant.id,
                user_id: user.id,
                role: "admin",
                employee_id: employeeId,
                status: "active"
            }, { onConflict: 'user_id, tenant_id' });

        console.log("→ Tenant created and profile updated:", tenant.id);
        return NextResponse.json({ ok: true, tenantId: tenant.id });


    } catch (err) {
        console.error("→ Unexpected error:", err);
        return NextResponse.json(
            { ok: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
