'use client';

import { Shield, ShieldCheck, Users, Info, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";

const ROLE_DETAILS = [
    {
        role: "admin",
        title: "Administrator",
        description: "Full system access, including billing, security settings, and team management.",
        icon: ShieldCheck,
        color: "amber",
        permissions: [
            "Full control over Organization Settings",
            "Manage Billing and API Keys",
            "Global Team and Role Management",
            "Full Payroll and Employee data access",
            "Approve all leave requests",
        ]
    },
    {
        role: "hr",
        title: "Human Resources",
        description: "Focuses on employee lifecycle, payroll processing, and attendance management.",
        icon: Shield,
        color: "blue",
        permissions: [
            "Manage all Employees and Departments",
            "Process monthly Payroll and Salary Setup",
            "Oversee Attendance logs",
            "Manage Leave requests for all staff",
            "Invite new team members",
        ]
    },
    {
        role: "manager",
        title: "Manager",
        description: "Supervises specific departments and manages direct reports.",
        icon: Users,
        color: "indigo",
        permissions: [
            "View Departmental team list",
            "Approve/Reject leaves for team members",
            "Oversee team attendance logs",
            "Limited visibility of team performance",
        ]
    },
    {
        role: "employee",
        title: "Employee",
        description: "Standard access for personal self-service and task management.",
        icon: Users,
        color: "zinc",
        permissions: [
            "Personal Dashboard access",
            "Apply for Leaves and track Status",
            "View own Payslips and Salary details",
            "Clock-in / Clock-out (Attendance)",
        ]
    }
];

export default function RolesPage() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCounts() {
            try {
                const res = await fetch('/api/settings/team');
                const data = await res.json();
                if (data.employees) {
                    const c: Record<string, number> = {};
                    data.employees.forEach((e: any) => {
                        c[e.role] = (c[e.role] || 0) + 1;
                    });
                    setCounts(c);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchCounts();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold tracking-tight">Roles & Permissions</h2>
                <p className="text-muted-foreground">Understand and manage user access levels across the organization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ROLE_DETAILS.map((r) => {
                    const Icon = r.icon;
                    return (
                        <Card key={r.role} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className={`p-2 rounded-lg bg-${r.color}-50`}>
                                        <Icon className={`w-6 h-6 text-${r.color}-600`} />
                                    </div>
                                    <Badge variant="secondary" className="px-2.5 py-0.5">
                                        {loading ? "..." : (counts[r.role] || 0)} {counts[r.role] === 1 ? 'Member' : 'Members'}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4">{r.title}</CardTitle>
                                <CardDescription>{r.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2">
                                    {r.permissions.map((p, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                                            <Shield className="w-3 h-3 mt-1 text-zinc-400 shrink-0" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="border-t border-zinc-100 bg-zinc-50/30 px-6 py-4">
                                <Link href="/dashboard/settings/team" className="w-full">
                                    <Button variant="ghost" className="w-full justify-between hover:bg-white text-zinc-600 font-medium">
                                        View Members
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <Card className="bg-zinc-900 text-zinc-100 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-zinc-400" /> Granular Control
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Need more specific roles or custom permission sets?
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-zinc-400">
                        Custom role definition is available on our <strong>Pro</strong> and <strong>Enterprise</strong> plans.
                        You can currently use the four default roles which cover 95% of standard HR workflows.
                    </p>
                </CardContent>
                <CardFooter>
                    <Link href="/dashboard/settings/billing">
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                            Upgrade to Pro
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
