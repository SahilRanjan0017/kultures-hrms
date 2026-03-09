import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const { empCode } = await request.json();

        if (!empCode) {
            return NextResponse.json(
                { ok: false, message: "Employee code is required" },
                { status: 400 }
            );
        }

        const adminSupabase = createAdminClient();

        // Find member by emp_code returning user_id from employees table
        const { data: member, error } = await adminSupabase
            .from("employees")
            .select("tenant_id, email, full_name, user_id")
            .eq("emp_code", empCode.toUpperCase())
            .single();

        if (error || !member) {
            return NextResponse.json(
                { ok: false, message: "Invalid employee code" },
                { status: 404 }
            );
        }

        // We can just use the employee's direct email
        return NextResponse.json({
            ok: true,
            email: member.email,
        });

    } catch (err) {
        console.error("→ Resolve emp code error:", err);
        return NextResponse.json(
            { ok: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
