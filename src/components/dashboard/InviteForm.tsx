"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_OPTIONS = [
    { value: "hr", label: "HR — Manage employees & leaves" },
    { value: "manager", label: "Manager — View team & attendance" },
    { value: "employee", label: "Employee — Self service only" },
];

export default function InviteForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("employee");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [empCode, setEmpCode] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setMessage("");
        setEmpCode("");

        try {
            const response = await fetch("/api/team/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, role }),
            });

            const result = await response.json();

            if (result.ok) {
                setStatus("success");
                setEmpCode(result.empCode);
                setMessage(`✅ Account created for ${name}`);
                setName("");
                setEmail("");
                setRole("employee");
                setTimeout(() => window.location.reload(), 3000);
            } else {
                setStatus("error");
                setMessage(`❌ ${result.message}`);
            }
        } catch (err) {
            setStatus("error");
            setMessage("❌ Something went wrong. Try again.");
            console.error(err);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Full Name */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={status === "loading"}
                    />
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">
                        Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="email"
                        placeholder="rahul@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={status === "loading"}
                    />
                </div>

                {/* Role */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-zinc-700">
                        Role <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        disabled={status === "loading"}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
                    >
                        {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            {/* Info note */}
            <p className="text-xs text-zinc-400">
                ℹ️ Employee Code and temporary password will be auto-generated and sent to their email.
            </p>

            <Button
                type="submit"
                disabled={status === "loading"}
            >
                {status === "loading" ? "Creating account..." : "Create Account & Send Credentials →"}
            </Button>

            {/* Success with EMP code */}
            {status === "success" && empCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                    <p className="text-sm font-semibold text-green-800">
                        ✅ Account created successfully!
                    </p>
                    <p className="text-sm text-green-700">
                        Employee Code: <span className="font-bold tracking-widest">{empCode}</span>
                    </p>
                    <p className="text-xs text-green-600">
                        Credentials sent to {email}. Redirecting...
                    </p>
                </div>
            )}

            {status === "error" && message && (
                <p className="text-sm font-medium text-red-600">{message}</p>
            )}
        </form>
    );
}
