import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const { empCode } = await request.json();

        if (!empCode) {
            return NextResponse.json({ error: "Employee Code is required" }, { status: 400 });
        }

        const adminSupabase = createAdminClient();

        // 1. Find the employee and their email
        const { data: employee, error: empError } = await adminSupabase
            .from("employees")
            .select("user_id, email, full_name, tenants(name)")
            .eq("emp_code", empCode)
            .single();

        if (empError || !employee) {
            return NextResponse.json({ error: "Invalid Employee Code" }, { status: 404 });
        }

        // 2. Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // 3. Store OTP in database
        const { error: otpError } = await adminSupabase
            .from("otp_codes")
            .upsert({
                user_id: employee.user_id,
                code: otp,
                expires_at: expiresAt
            }, { onConflict: 'user_id' });

        if (otpError) {
            console.error("OTP storage error:", otpError);
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
        }

        // 4. Send Email
        const tenantName = Array.isArray(employee.tenants)
            ? employee.tenants[0]?.name
            : (employee.tenants as any)?.name;

        await sendEmail({
            to: employee.email,
            subject: "Password Reset OTP - Kultures HRMS",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
                    <h2 style="color:#111;">Password Reset Verification</h2>
                    <p>Hi ${employee.full_name},</p>
                    <p>You requested a password reset for your account at <strong>${tenantName || "Kultures"}</strong>.</p>
                    <div style="background:#f4f4f5;padding:24px;border-radius:8px;margin:24px 0;text-align:center;">
                        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111;">${otp}</span>
                    </div>
                    <p style="color:#666;font-size:14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `
        });

        return NextResponse.json({ ok: true, message: "OTP sent to registered email" });

    } catch (err: any) {
        console.error("Request OTP error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
