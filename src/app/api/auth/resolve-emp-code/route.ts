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

        // Find member by emp_code returning profile id 
        const { data: member, error } = await adminSupabase
            .from("profiles")
            .select("id")
            .eq("emp_code", empCode.toUpperCase())
            .single();

        if (error || !member) {
            return NextResponse.json(
                { ok: false, message: "Invalid employee code" },
                { status: 404 }
            );
        }

        // Get email from auth.users
        const { data: userData, error: userError } = await adminSupabase
            .auth.admin.getUserById(member.id);

        if (userError || !userData?.user?.email) {
            return NextResponse.json(
                { ok: false, message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            email: userData.user.email,
        });

    } catch (err) {
        console.error("→ Resolve emp code error:", err);
        return NextResponse.json(
            { ok: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
