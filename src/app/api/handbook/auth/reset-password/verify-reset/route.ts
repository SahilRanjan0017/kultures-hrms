import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const { identifier, otp, newPassword } = await request.json();

        if (!identifier || !otp || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const adminSupabase = createAdminClient();

        // 1. Find the user ID from identifier (check both emp_code and email)
        const isEmail = identifier.includes("@");

        let query = adminSupabase
            .from("employees")
            .select("user_id");

        if (isEmail) {
            query = query.eq("email", identifier.toLowerCase());
        } else {
            query = query.eq("emp_code", identifier.toUpperCase());
        }

        const { data: employee, error: empError } = await query.single();

        if (empError || !employee) {
            return NextResponse.json({ error: "Invalid Employee Code or Email" }, { status: 404 });
        }


        // 2. Verify OTP
        const { data: otpRecord, error: otpFetchError } = await adminSupabase
            .from("otp_codes")
            .select("*")
            .eq("user_id", employee.user_id)
            .eq("code", otp)
            .gt("expires_at", new Date().toISOString())
            .single();

        if (otpFetchError || !otpRecord) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // 3. Reset Password in Supabase Auth
        const { error: resetError } = await adminSupabase.auth.admin.updateUserById(
            employee.user_id,
            { password: newPassword }
        );

        if (resetError) {
            return NextResponse.json({ error: resetError.message }, { status: 400 });
        }

        // 4. Delete the used OTP
        await adminSupabase.from("otp_codes").delete().eq("id", otpRecord.id);

        return NextResponse.json({ ok: true, message: "Password updated successfully" });

    } catch (err: any) {
        console.error("Verify reset error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
