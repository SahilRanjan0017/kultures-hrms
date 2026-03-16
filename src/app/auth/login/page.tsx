"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error"); // ✅ catch OTP expired error

    const [loginType, setLoginType] = useState<"email" | "empcode">("email");
    const [email, setEmail] = useState("");
    const [empCode, setEmpCode] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        const supabase = createClient();

        let loginEmail = email;

        // If logging in with EMP code → resolve email first
        if (loginType === "empcode") {
            const res = await fetch("/api/handbook/auth/resolve-emp-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ empCode }),
            });
            const result = await res.json();

            if (!result.ok) {
                setStatus("error");
                setMessage("Invalid Employee Code. Please check and try again.");
                return;
            }
            loginEmail = result.email;
        }

        // Login with email + password
        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password,
        });

        if (error) {
            setStatus("error");
            setMessage("Invalid credentials. Please check and try again.");
            return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setStatus("error");
            setMessage("Login failed. Please try again.");
            return;
        }

        // ✅ Robust API-based Sync
        console.log("→ [CLIENT] Triggering /api/auth/sync");
        const syncResponse = await fetch("/api/auth/sync", { method: "POST" });
        const syncResult = await syncResponse.json();
        console.log("→ [CLIENT] sync result:", syncResult);

        // Use synced profile or fallback to client-side check
        let profile = syncResult?.profile || (await supabase
            .from("profiles")
            .select("tenant_id, is_first_login, role, employee_id")
            .eq("id", user.id)
            .single()).data;


        // ✅ Route based on profile state
        if (profile?.is_first_login) {
            router.push("/auth/set-password");
        } else if (!profile?.tenant_id) {
            router.push("/onboarding");
        } else {
            router.push("/dashboard");
        }


    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side: Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#FFCA28] flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="z-10 text-center space-y-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4">
                        <h1 className="text-6xl font-black text-zinc-900 tracking-tight flex items-baseline animate-vibrate">
                            Kulture
                        </h1>
                    </div>
                    <p className="text-2xl font-medium text-zinc-900">
                        Smart HR Tech for all businesses
                    </p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative">
                <div className="mx-auto w-full max-w-sm">

                    {/* Tenant Logo Placeholder (can be driven by DB later) */}
                    <div className="mb-10 animate-fade-in [animation-delay:200ms] flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-zinc-900">Kulture</h2>
                    </div>

                    {/* ✅ OTP Expired Error from URL */}
                    {urlError === "otp_expired" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <p className="text-sm text-red-600 text-center font-medium">
                                ⚠️ Email link expired. Please sign in manually below.
                            </p>
                        </div>
                    )}

                    {/* ✅ Auth Failed Error from URL */}
                    {urlError === "auth_failed" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                            <p className="text-sm text-red-600 text-center font-medium">
                                ⚠️ Authentication failed. Please try again.
                            </p>
                        </div>
                    )}
                    <div className="flex rounded-lg border border-zinc-200 p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setLoginType("email")}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginType === "email"
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-500 hover:text-zinc-900"
                                }`}
                        >
                            Email Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType("empcode")}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginType === "empcode"
                                ? "bg-zinc-900 text-white"
                                : "text-zinc-500 hover:text-zinc-900"
                                }`}
                        >
                            Employee Code
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {loginType === "email" ? (
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-zinc-700">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={status === "loading"}
                                />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-zinc-700">
                                    Employee Code
                                </label>
                                <Input
                                    type="text"
                                    placeholder="EMP-001"
                                    value={empCode}
                                    onChange={(e) => setEmpCode(e.target.value.toUpperCase())}
                                    required
                                    disabled={status === "loading"}
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-700">
                                    Password
                                </label>
                                <Link
                                    href="/auth/reset-password"
                                    className="text-xs text-zinc-500 hover:text-black transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={status === "loading"}
                            />
                        </div>



                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full bg-[#14b8a6] hover:bg-[#0f766e] text-white py-6 text-sm font-medium"
                                disabled={status === "loading"}
                            >
                                {status === "loading" ? "Signing in..." : "Sign In"}
                            </Button>
                        </div>

                    </form>

                    {message && (
                        <p className="text-sm text-center text-red-600 font-medium mt-4">
                            {message}
                        </p>
                    )}

                    {/* Toggle Login Type (Hidden functionality but accessible if needed) */}
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => setLoginType(loginType === "empcode" ? "email" : "empcode")}
                            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                        >
                            {loginType === "empcode" ? "Login with Email instead" : "Login with Employee ID instead"}
                        </button>
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-xs text-zinc-400 mb-2">Powered By</p>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h1 className="text-xl font-black text-zinc-900 tracking-tight flex items-baseline animate-vibrate">
                                Kulture
                            </h1>
                        </div>
                        <p className="text-[10px] text-zinc-400 mb-6">© 2026 Kulture Private Limited</p>

                        <div className="flex justify-center gap-6 text-xs text-[#14b8a6] font-medium">
                            <Link href="/privacy">Privacy</Link>
                            <Link href="/legal">Legal</Link>
                            <Link href="/contact">Contact</Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

