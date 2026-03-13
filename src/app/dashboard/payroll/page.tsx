'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    DollarSign, FileText, Settings2, Plus, Loader2, CheckCircle,
    Clock, AlertCircle, ChevronRight, TrendingUp, Users, CalendarDays,
    Banknote, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { format } from 'date-fns';

interface Payslip {
    id: string;
    month: string;
    net_salary: number;
    gross_salary: number;
    total_deductions: number;
    basic_salary: number;
    hra: number;
    transport_allowance: number;
    other_allowances: number;
    pf_deduction: number;
    tds_deduction: number;
    other_deductions: number;
    present_days: number;
    working_days: number;
    employee?: { full_name: string; emp_code: string; department: string; designation: string };
    payroll_run?: { status: string };
}

interface PayrollRun {
    id: string;
    month: string;
    status: 'draft' | 'processed' | 'paid';
    generated_at: string;
}

function StatusPill({ status }: { status: string }) {
    const config: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
        draft: { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', label: 'Draft', icon: <Clock className="w-3 h-3" /> },
        processed: { cls: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Processed', icon: <CheckCircle className="w-3 h-3" /> },
        paid: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Paid', icon: <CheckCircle className="w-3 h-3" /> },
    };
    const s = config[status] ?? config.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
            {s.icon} {s.label}
        </span>
    );
}

function fmt(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
    return (
        <Card className="border-zinc-200 hover:shadow-sm transition-shadow">
            <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-2xl font-bold text-zinc-900">{value}</p>
                        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Employee / Manager self-view ─────────────────────────────────────────────
function EmployeePayrollView({ payslips }: { payslips: Payslip[] }) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentSlip = payslips.find(p => p.month === currentMonth);
    const lastSlip = payslips.find(p => p.month !== currentMonth);

    const delta = currentSlip && lastSlip
        ? currentSlip.net_salary - lastSlip.net_salary
        : null;

    return (
        <div className="space-y-6">
            {/* Hero Payslip Card */}
            {currentSlip ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white p-8 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                            {format(new Date(currentSlip.month + '-01'), 'MMMM yyyy')} — Net Salary
                        </p>
                        <p className="text-5xl font-bold tracking-tight">{fmt(currentSlip.net_salary)}</p>

                        {delta !== null && (
                            <div className={`inline-flex items-center gap-1.5 mt-3 text-sm font-medium ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {delta >= 0
                                    ? <ArrowUpRight className="w-4 h-4" />
                                    : <ArrowDownRight className="w-4 h-4" />}
                                {fmt(Math.abs(delta))} vs last month
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-xs text-zinc-400">Gross</p>
                                <p className="font-semibold">{fmt(currentSlip.gross_salary)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400">Deductions</p>
                                <p className="font-semibold text-red-400">-{fmt(currentSlip.total_deductions)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400">Days Present</p>
                                <p className="font-semibold">{currentSlip.present_days}/{currentSlip.working_days}</p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <Link href={`/dashboard/payroll/payslip/${currentSlip.id}`}>
                                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                                    <FileText className="w-4 h-4" /> View & Download Payslip
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
                    <DollarSign className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="font-medium text-zinc-500">No payslip for {format(new Date(), 'MMMM yyyy')}</p>
                    <p className="text-sm text-zinc-400 mt-1">Payroll hasn't been processed yet. Check back soon.</p>
                </div>
            )}

            {/* Breakdown Cards */}
            {currentSlip && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Basic Salary', value: fmt(currentSlip.basic_salary), color: 'text-zinc-700' },
                        { label: 'HRA', value: fmt(currentSlip.hra), color: 'text-zinc-700' },
                        { label: 'PF', value: `-${fmt(currentSlip.pf_deduction)}`, color: 'text-red-600' },
                        { label: 'TDS', value: `-${fmt(currentSlip.tds_deduction)}`, color: 'text-red-600' },
                    ].map(item => (
                        <div key={item.label} className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* History Table */}
            {payslips.length > 0 && (
                <Card className="border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-zinc-400" /> Payslip History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50">
                                    <TableHead>Month</TableHead>
                                    <TableHead>Gross</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Salary</TableHead>
                                    <TableHead>Attendance</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payslips.map(slip => (
                                    <TableRow key={slip.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(slip.month + '-01'), 'MMM yyyy')}
                                        </TableCell>
                                        <TableCell>{fmt(slip.gross_salary)}</TableCell>
                                        <TableCell className="text-red-600 font-medium">-{fmt(slip.total_deductions)}</TableCell>
                                        <TableCell className="font-bold text-zinc-900">{fmt(slip.net_salary)}</TableCell>
                                        <TableCell>
                                            <span className={slip.present_days < slip.working_days ? 'text-amber-600 font-medium' : 'text-green-700 font-medium'}>
                                                {slip.present_days}
                                            </span>
                                            <span className="text-zinc-400">/{slip.working_days}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/payroll/payslip/${slip.id}`}>
                                                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                                                    <FileText className="w-3 h-3" /> View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── Admin / HR overview ──────────────────────────────────────────────────────
function AdminPayrollView({ payslips, runs, isAdmin, onGenerate, generating, error }: {
    payslips: Payslip[];
    runs: PayrollRun[];
    isAdmin: boolean;
    onGenerate: () => void;
    generating: boolean;
    error: string;
}) {
    const router = useRouter();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthRun = runs.find(r => r.month === currentMonth);
    const thisMonthSlips = payslips.filter(p => p.month === currentMonth);
    const totalNet = thisMonthSlips.reduce((s, p) => s + (p.net_salary ?? 0), 0);
    const totalGross = thisMonthSlips.reduce((s, p) => s + (p.gross_salary ?? 0), 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
                    <p className="text-muted-foreground mt-1">Manage salary structures and monthly payroll runs.</p>
                </div>
                <div className="flex gap-3">
                    {/* Both admin and HR can access salary setup */}
                    <Link href="/dashboard/payroll/setup">
                        <Button variant="outline" className="gap-2">
                            <Settings2 className="w-4 h-4" /> Salary Setup
                        </Button>
                    </Link>
                    {/* Only admin can generate payroll */}
                    {isAdmin && !thisMonthRun && (
                        <Button onClick={onGenerate} disabled={generating} className="gap-2 shadow-lg shadow-primary/20">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Generate {format(new Date(), 'MMM yyyy')} Payroll
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={<Banknote className="w-5 h-5 text-purple-600" />} label="Net Payout This Month"
                    value={thisMonthRun ? fmt(totalNet) : '—'}
                    sub={thisMonthRun ? `${thisMonthSlips.length} employees` : 'Not generated yet'}
                    color="bg-purple-50" />
                <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} label="Gross This Month"
                    value={thisMonthRun ? fmt(totalGross) : '—'}
                    color="bg-blue-50" />
                <StatCard icon={<Users className="w-5 h-5 text-green-600" />} label="Employees Processed"
                    value={String(thisMonthSlips.length)}
                    color="bg-green-50" />
                <StatCard icon={<CalendarDays className="w-5 h-5 text-amber-600" />} label="Total Runs"
                    value={String(runs.length)}
                    color="bg-amber-50" />
            </div>

            {/* Status Banner for current month */}
            {thisMonthRun && (
                <div className={`flex items-center justify-between p-4 rounded-xl border ${thisMonthRun.status === 'paid'
                    ? 'bg-emerald-50 border-emerald-200'
                    : thisMonthRun.status === 'processed'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <StatusPill status={thisMonthRun.status} />
                        <p className="text-sm font-medium text-zinc-700">
                            {format(new Date(), 'MMMM yyyy')} payroll is {thisMonthRun.status}.
                        </p>
                    </div>
                    <Link href={`/dashboard/payroll/${thisMonthRun.month}`}>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-sm">
                            View Details <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Payroll Runs Table */}
            {runs.length > 0 ? (
                <Card className="border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-base">Payroll Run History</CardTitle>
                        <CardDescription>Click any row to view the full employee breakdown.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50">
                                    <TableHead>Month</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Gross Payout</TableHead>
                                    <TableHead>Net Payout</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Generated</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.map(run => {
                                    const slips = payslips.filter(p => p.month === run.month);
                                    const gross = slips.reduce((s, p) => s + (p.gross_salary ?? 0), 0);
                                    const net = slips.reduce((s, p) => s + (p.net_salary ?? 0), 0);
                                    return (
                                        <TableRow key={run.id} className="cursor-pointer hover:bg-zinc-50"
                                            onClick={() => router.push(`/dashboard/payroll/${run.month}`)}>
                                            <TableCell className="font-semibold">
                                                {format(new Date(run.month + '-01'), 'MMMM yyyy')}
                                            </TableCell>
                                            <TableCell>{slips.length}</TableCell>
                                            <TableCell>{fmt(gross)}</TableCell>
                                            <TableCell className="font-bold">{fmt(net)}</TableCell>
                                            <TableCell><StatusPill status={run.status} /></TableCell>
                                            <TableCell className="text-xs text-zinc-500">
                                                {format(new Date(run.generated_at), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed border-2 bg-zinc-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <DollarSign className="w-12 h-12 text-zinc-300 mb-3" />
                        <p className="text-zinc-500 font-medium">No payroll runs yet</p>
                        <p className="text-sm text-zinc-400 mt-1">Set up salary structures before generating payroll.</p>
                        <Link href="/dashboard/payroll/setup" className="mt-4">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Settings2 className="w-3.5 h-3.5" /> Set Up Salaries
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PayrollPage() {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'admin' | 'hr' | 'other'>('other');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const meRes = await fetch('/api/payroll/me');
            const meData = await meRes.json();

            // Set role straight from the DB
            const r = meData.role as string;
            setRole(r === 'admin' ? 'admin' : r === 'hr' ? 'hr' : 'other');

            const fetches: Promise<any>[] = [fetch('/api/payroll/payslips')];
            if (r === 'admin' || r === 'hr') {
                fetches.push(fetch('/api/payroll/run'));
            }

            const results = await Promise.all(fetches);
            const payslipData = await results[0].json();
            const runData = results[1] ? await results[1].json() : { runs: [] };

            setPayslips(payslipData.payslips ?? []);
            if (runData && !runData.error) setRuns(runData.runs ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function generatePayroll() {
        const month = new Date().toISOString().slice(0, 7);
        if (!confirm(`Generate payroll for ${format(new Date(), 'MMMM yyyy')}? This cannot be undone.`)) return;

        setGenerating(true);
        setError('');
        try {
            const res = await fetch('/api/payroll/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Failed to generate payroll');
                return;
            }
            await fetchData();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setGenerating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-zinc-400">Loading payroll data…</p>
            </div>
        );
    }

    const isAdminOrHr = role === 'admin' || role === 'hr';

    if (isAdminOrHr) {
        return (
            <AdminPayrollView
                payslips={payslips}
                runs={runs}
                isAdmin={role === 'admin'}
                onGenerate={generatePayroll}
                generating={generating}
                error={error}
            />
        );
    }

    // Employee / Manager view
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Payroll</h1>
                <p className="text-muted-foreground mt-1">Your salary details and payslip history.</p>
            </div>
            <EmployeePayrollView payslips={payslips} />
        </div>
    );
}
