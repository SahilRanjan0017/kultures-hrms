import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const { empCode, otp, newPassword } = await request.json();

        if (!empCode || !otp || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const adminSupabase = createAdminClient();

        // 1. Find the user ID from empCode
        const { data: employee, error: empError } = await adminSupabase
            .from("employees")
            .select("user_id")
            .eq("emp_code", empCode)
            .single();

        if (empError || !employee) {
            return NextResponse.json({ error: "Invalid Employee Code" }, { status: 404 });
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
