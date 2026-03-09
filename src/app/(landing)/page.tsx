"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (status === "loading" || status === "sent") return;
        setStatus("loading");
        setMessage("");

        // ✅ Direct browser call — PKCE stored correctly
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
            },
        });

        if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
        }

        setStatus("sent");
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 py-12 px-4">
            <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
                <div>
                    <h1 className="text-center text-3xl font-bold text-zinc-900">
                        Kultures HRMS
                    </h1>
                    <p className="mt-2 text-center text-sm text-zinc-600">
                        Enter your email to get started
                    </p>
                </div>

                {status === "sent" ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-6 text-center space-y-2">
                        <p className="text-green-700 font-semibold">✅ Magic link sent!</p>
                        <p className="text-sm text-green-600">
                            Check <strong>{email}</strong> and click the link to continue.
                        </p>
                        <p className="text-xs text-zinc-400">Also check spam folder</p>
                        <button
                            onClick={() => { setStatus("idle"); setEmail(""); }}
                            className="text-xs text-zinc-400 underline mt-1"
                        >
                            Use a different email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={status === "loading"}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Sending..." : "Get Started →"}
                        </Button>

                        {status === "error" && (
                            <p className="text-sm text-center text-red-600">
                                ❌ {message}
                            </p>
                        )}
                    </form>
                )}

                <p className="text-center text-sm text-zinc-400">
                    Already have an account?{" "}
                    <a href="/auth/login" className="text-zinc-900 font-medium hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
