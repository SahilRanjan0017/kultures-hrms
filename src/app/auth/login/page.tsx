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
            const res = await fetch("/api/auth/resolve-emp-code", {
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

        // ✅ Check profiles table (not tenant_members)
        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id, is_first_login, role")
            .eq("id", user.id)
            .single();

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
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">

                <div>
                    <h1 className="text-center text-3xl font-bold text-zinc-900">
                        Sign in
                    </h1>
                    <p className="mt-2 text-center text-sm text-zinc-500">
                        Access your Kultures HRMS dashboard
                    </p>
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
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <p className="text-sm text-red-600 text-center font-medium">
                            ⚠️ Authentication failed. Please try again.
                        </p>
                    </div>
                )}

                {/* Toggle Login Type */}
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

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "Signing in..." : "Sign In →"}
                    </Button>

                </form>

                {message && (
                    <p className="text-sm text-center text-red-600 font-medium">
                        {message}
                    </p>
                )}

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

