import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { createHash, randomInt } from "crypto";

// ── Rate Limit Constants
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;

// ── Deterministic SHA-256 hash of OTP for safe storage
// The raw OTP is only ever in memory and sent via email — never persisted in plaintext.
function hashOtp(otp: string): string {
    return createHash("sha256").update(otp).digest("hex");
}

// ── Extract real client IP (handles proxies / Vercel edge)
function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
    );
}

export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json({ error: "Employee Code or Email is required" }, { status: 400 });
        }

        const adminSupabase = createAdminClient();
        const normalizedId = identifier.toLowerCase().trim();
        const clientIp = getClientIp(request);
        const now = new Date();

        // ── STEP 0A: Identifier-level rate limit (existing — unchanged logic)
        const { data: rateRecord } = await adminSupabase
            .from("otp_rate_limits")
            .select("*")
            .eq("identifier", normalizedId)
            .single();

        if (rateRecord) {
            if (rateRecord.blocked_until && new Date(rateRecord.blocked_until) > now) {
                const minutesLeft = Math.ceil(
                    (new Date(rateRecord.blocked_until).getTime() - now.getTime()) / 60000
                );
                return NextResponse.json(
                    { error: `Too many OTP requests. Try again in ${minutesLeft} minute(s).` },
                    { status: 429 }
                );
            }

            const windowExpired =
                (now.getTime() - new Date(rateRecord.first_attempt).getTime()) >
                WINDOW_MINUTES * 60 * 1000;

            if (windowExpired) {
                await adminSupabase
                    .from("otp_rate_limits")
                    .update({
                        attempt_count: 1,
                        first_attempt: now.toISOString(),
                        last_attempt: now.toISOString(),
                        blocked_until: null,
                    })
                    .eq("identifier", normalizedId);
            } else if (rateRecord.attempt_count >= MAX_ATTEMPTS) {
                const blockedUntil = new Date(
                    now.getTime() + BLOCK_MINUTES * 60 * 1000
                ).toISOString();
                await adminSupabase
                    .from("otp_rate_limits")
                    .update({ blocked_until: blockedUntil, last_attempt: now.toISOString() })
                    .eq("identifier", normalizedId);
                return NextResponse.json(
                    { error: `Too many OTP requests. Blocked for ${BLOCK_MINUTES} minutes.` },
                    { status: 429 }
                );
            } else {
                await adminSupabase
                    .from("otp_rate_limits")
                    .update({
                        attempt_count: rateRecord.attempt_count + 1,
                        last_attempt: now.toISOString(),
                    })
                    .eq("identifier", normalizedId);
            }
        } else {
            await adminSupabase.from("otp_rate_limits").insert({
                identifier: normalizedId,
                attempt_count: 1,
                first_attempt: now.toISOString(),
                last_attempt: now.toISOString(),
            });
        }

        // ── STEP 0B: IP-level rate limit (edge protection — allows 10 requests per 15min per IP)
        const IP_MAX = 10;
        const ipKey = `ip:${clientIp}`;
        const { data: ipRecord } = await adminSupabase
            .from("otp_rate_limits")
            .select("*")
            .eq("identifier", ipKey)
            .single();

        if (ipRecord) {
            const ipWindowExpired =
                (now.getTime() - new Date(ipRecord.first_attempt).getTime()) >
                WINDOW_MINUTES * 60 * 1000;

            if (ipRecord.blocked_until && new Date(ipRecord.blocked_until) > now) {
                return NextResponse.json(
                    { error: "Too many requests from this IP. Please try again later." },
                    { status: 429 }
                );
            }

            if (!ipWindowExpired && ipRecord.attempt_count >= IP_MAX) {
                const blockedUntil = new Date(
                    now.getTime() + BLOCK_MINUTES * 60 * 1000
                ).toISOString();
                await adminSupabase
                    .from("otp_rate_limits")
                    .update({ blocked_until: blockedUntil, last_attempt: now.toISOString() })
                    .eq("identifier", ipKey);
                return NextResponse.json(
                    { error: "Too many requests from this IP. Blocked for 30 minutes." },
                    { status: 429 }
                );
            }

            await adminSupabase
                .from("otp_rate_limits")
                .update({
                    attempt_count: ipWindowExpired ? 1 : ipRecord.attempt_count + 1,
                    first_attempt: ipWindowExpired ? now.toISOString() : ipRecord.first_attempt,
                    last_attempt: now.toISOString(),
                    blocked_until: ipWindowExpired ? null : ipRecord.blocked_until,
                })
                .eq("identifier", ipKey);
        } else {
            await adminSupabase.from("otp_rate_limits").insert({
                identifier: ipKey,
                attempt_count: 1,
                first_attempt: now.toISOString(),
                last_attempt: now.toISOString(),
            });
        }

        // ── Extract the host/subdomain to resolve the tenant
        const host = request.headers.get("host") || "";
        const subdomain = host.split(".")[0];
        let tenantId = null;

        if (subdomain && subdomain !== "localhost" && subdomain !== "kultures") {
            const { data: tenant } = await adminSupabase
                .from("tenants")
                .select("id")
                .eq("slug", subdomain)
                .single();
            if (tenant) tenantId = tenant.id;
        }

        // ── 1. Find the employee
        const isEmail = identifier.includes("@");
        let query = adminSupabase
            .from("employees")
            .select("user_id, email, full_name, tenants(name)");

        if (isEmail) {
            query = query.eq("email", identifier.toLowerCase());
        } else {
            query = query.eq("emp_code", identifier.toUpperCase());
        }
        if (tenantId) query = query.eq("tenant_id", tenantId);

        const { data: employee, error: empError } = await query.single();

        if (empError || !employee) {
            return NextResponse.json(
                { error: "Invalid Employee Code or Email" },
                { status: 404 }
            );
        }

        // ── 2. Generate cryptographically secure OTP + hash for storage
        const otp = randomInt(1000, 10000).toString();         // 4-digit, crypto-safe
        const otpHash = hashOtp(otp);                          // SHA-256 — never store raw
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // ── 3. Upsert hashed OTP (code column stores hash, not plaintext)
        const { error: otpError } = await adminSupabase
            .from("otp_codes")
            .upsert(
                { user_id: employee.user_id, code: otpHash, expires_at: expiresAt },
                { onConflict: "user_id" }
            );

        if (otpError) {
            console.error("OTP storage error:", otpError);
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
        }

        // ── 4. Send plaintext OTP via email (only place the raw code exists)
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
                    <p style="color:#666;font-size:14px;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
                </div>
            `,
        });

        return NextResponse.json({ ok: true, message: "OTP sent to registered email" });
    } catch (err: any) {
        console.error("Request OTP error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
