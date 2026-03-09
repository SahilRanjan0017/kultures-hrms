"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetPasswordPage() {
    const router = useRouter();
    const [form, setForm] = useState({ password: "", confirm: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        if (form.password !== form.confirm) {
            setStatus("error");
            setMessage("Passwords do not match");
            return;
        }

        if (form.password.length < 6) {
            setStatus("error");
            setMessage("Password must be at least 6 characters");
            return;
        }

        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
            password: form.password,
        });

        if (error) {
            setStatus("error");
            setMessage(error.message);
            return;
        }

        // Clear is_first_login flag
        await fetch("/api/auth/clear-password-flag", { method: "POST" });

        router.push("/dashboard");
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">

                <div>
                    <h1 className="text-center text-3xl font-bold text-zinc-900">
                        Set New Password
                    </h1>
                    <p className="mt-2 text-center text-sm text-zinc-500">
                        You must set a new password before continuing
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700">
                            New Password
                        </label>
                        <Input
                            type="password"
                            placeholder="Min 6 characters"
                            value={form.password}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, password: e.target.value }))
                            }
                            required
                            disabled={status === "loading"}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700">
                            Confirm Password
                        </label>
                        <Input
                            type="password"
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, confirm: e.target.value }))
                            }
                            required
                            disabled={status === "loading"}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "Saving..." : "Set Password & Continue →"}
                    </Button>

                </form>

                {message && (
                    <p
                        className={`text-sm text-center font-medium ${status === "error" ? "text-red-600" : "text-green-600"
                            }`}
                    >
                        {message}
                    </p>
                )}

            </div>
        </div>
    );
}
