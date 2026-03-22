"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INDUSTRY_OPTIONS = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Construction",
    "Real Estate",
    "Hospitality",
    "Other",
];

const SIZE_OPTIONS = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "500+ employees",
];

import { useAuth } from "@/components/providers/AuthProvider";

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        companyName: "",
        industry: "",
        size: "",
    });

    // ✅ Check if user already belongs to a tenant
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/auth/login");
            return;
        }

        async function checkExistingTenant() {
            const supabase = createClient();

            // ✅ Handle OTP expired error in URL hash
            const hash = window.location.hash;
            if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
                router.push("/auth/login");
                return;
            }

            // ✅ Check profiles table
            let { data } = await supabase
                .from("profiles")
                .select("tenant_id, role")
                .eq("id", user!.id)
                .single();

            // ✅ If they are an admin, they have already onboarded
            if (data?.tenant_id && data.role === 'admin') {
                router.push("/dashboard");
            }
        }
        checkExistingTenant();
    }, [user, authLoading, router]);



    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setStatus("loading");
        setMessage("");

        if (!form.companyName || !form.industry || !form.size) {
            setStatus("error");
            setMessage("Please fill in all 3 fields");
            return;
        }

        try {
            const response = await fetch("/api/onboarding/create-tenant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const result = await response.json();

            if (result.ok) {
                router.push("/dashboard");
            } else {
                setStatus("error");
                setMessage(result.message || "Something went wrong");
            }
        } catch (err) {
            console.error(err);
            setStatus("error");
            setMessage("Unexpected error. Please try again.");
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-10 shadow-md">

                {/* Header */}
                <div>
                    <h1 className="text-center text-3xl font-bold text-zinc-900">
                        Set Up Your Company
                    </h1>

                    <p className="mt-2 text-center text-sm text-zinc-500">
                        Fill in all 3 fields below to create your workspace
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Company Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700">
                            Company Name <span className="text-red-500">*</span>
                        </label>

                        <Input
                            name="companyName"
                            type="text"
                            placeholder="e.g. Kultures Technologies Pvt Ltd"
                            value={form.companyName}
                            onChange={handleChange}
                            required
                            disabled={status === "loading"}
                        />
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700">
                            Industry <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="industry"
                            value={form.industry}
                            onChange={handleChange}
                            required
                            disabled={status === "loading"}
                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
                        >
                            <option value="" disabled>
                                Select your industry
                            </option>

                            {INDUSTRY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Company Size */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700">
                            Company Size <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="size"
                            value={form.size}
                            onChange={handleChange}
                            required
                            disabled={status === "loading"}
                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
                        >
                            <option value="" disabled>
                                Select company size
                            </option>

                            {SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={status === "loading"}
                    >
                        {status === "loading"
                            ? "Creating workspace..."
                            : "Create Workspace →"}
                    </Button>
                </form>

                {/* Error Message */}
                {message && (
                    <p className="text-center text-sm font-medium text-red-600">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}