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

    const [role, setRole] = useState<"admin" | "employee" | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [message, setMessage] = useState("");

    const [companyForm, setCompanyForm] = useState({
        companyName: "",
        industry: "",
        size: "",
    });

    const [profileForm, setProfileForm] = useState({
        phone: "",
        address: "",
        emergency_contact: "",
    });

    // ✅ Check if user already belongs to a tenant or is an employee
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/auth/login");
            return;
        }

        async function checkStatus() {
            const supabase = createClient();

            // ✅ Handle OTP expired error in URL hash
            const hash = window.location.hash;
            if (hash.includes("error=access_denied") || hash.includes("otp_expired")) {
                router.push("/auth/login");
                return;
            }

            // ✅ Check profiles table
            let { data: profile } = await supabase
                .from("profiles")
                .select("tenant_id, role, onboarding_completed")
                .eq("id", user!.id)
                .single();

            if (profile?.onboarding_completed) {
                router.push("/dashboard");
                return;
            }

            setRole(profile?.role as any || "employee");

            // ✅ If they are an admin and have a tenant_id, they've already onboarded
            if (profile?.tenant_id && profile.role === 'admin') {
                router.push("/dashboard");
            }
        }
        checkStatus();
    }, [user, authLoading, router]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCompanyForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const response = await fetch("/api/onboarding/create-tenant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(companyForm),
            });

            const result = await response.json();

            if (result.ok) {
                router.push("/dashboard");
            } else {
                setStatus("error");
                setMessage(result.message || "Something went wrong");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Unexpected error. Please try again.");
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const response = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: "employee",
                    ...profileForm
                }),
            });

            const result = await response.json();

            if (result.ok) {
                router.push("/dashboard");
            } else {
                setStatus("error");
                setMessage(result.message || "Something went wrong");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Unexpected error. Please try again.");
        }
    };

    if (authLoading || !role) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-lg space-y-8 rounded-xl bg-white p-10 shadow-md">

                {role === "admin" ? (
                    <>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-zinc-900">Set Up Your Company</h1>
                            <p className="mt-2 text-sm text-zinc-500">Create your workplace profile to get started.</p>
                        </div>
                        <form onSubmit={handleCompanySubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700">Company Name</label>
                                <Input name="companyName" value={companyForm.companyName} onChange={handleCompanyChange} required placeholder="e.g. Kultures Pvt Ltd" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700">Industry</label>
                                <select name="industry" value={companyForm.industry} onChange={handleCompanyChange} required className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
                                    <option value="" disabled>Select your industry</option>
                                    {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700">Company Size</label>
                                <select name="size" value={companyForm.size} onChange={handleCompanyChange} required className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
                                    <option value="" disabled>Select company size</option>
                                    {SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <Button type="submit" className="w-full" disabled={status === "loading"}>
                                {status === "loading" ? "Processing..." : "Finish Set Up →"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-zinc-900">Complete Your Profile</h1>
                            <p className="mt-2 text-sm text-zinc-500">Enter your details to access the dashboard.</p>
                        </div>
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700">Phone Number</label>
                                <Input name="phone" value={profileForm.phone} onChange={handleProfileChange} required placeholder="+91 9876543210" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700">Current Address</label>
                                <Input name="address" value={profileForm.address} onChange={handleProfileChange} required placeholder="Area, City, State" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-700">Emergency Contact</label>
                                <Input name="emergency_contact" value={profileForm.emergency_contact} onChange={handleProfileChange} required placeholder="Name - Relationship - Phone" />
                            </div>
                            <Button type="submit" className="w-full" disabled={status === "loading"}>
                                {status === "loading" ? "Processing..." : "Complete Profile →"}
                            </Button>
                        </form>
                    </>
                )}

                {message && <p className="text-center text-sm font-medium text-red-600">{message}</p>}
            </div>
        </div>
    );
}