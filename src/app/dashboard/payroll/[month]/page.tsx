'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { format } from 'date-fns';

interface Payslip {
    id: string;
    employee_id: string;
    employee: { full_name: string; emp_code: string; department: string; designation: string };
    basic_salary: number;
    hra: number;
    transport_allowance: number;
    other_allowances: number;
    gross_salary: number;
    pf_deduction: number;
    tds_deduction: number;
    other_deductions: number;
    total_deductions: number;
    net_salary: number;
    working_days: number;
    present_days: number;
}

interface PayrollRun {
    id: string;
    month: string;
    status: 'draft' | 'processed' | 'paid';
    generated_at: string;
}

function fmt(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
        draft: { label: 'Draft', class: 'bg-zinc-100 text-zinc-600', icon: <Clock className="w-3 h-3" /> },
        processed: { label: 'Processed', class: 'bg-blue-50 text-blue-600', icon: <CheckCircle className="w-3 h-3" /> },
        paid: { label: 'Paid', class: 'bg-green-50 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    };
    const s = map[status] ?? map.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.class}`}>
            {s.icon} {s.label}
        </span>
    );
}

export default function MonthlyPayrollPage() {
    const params = useParams();
    const router = useRouter();
    const month = params.month as string; // e.g. "2025-03"

    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [run, setRun] = useState<PayrollRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [payslipRes, runRes] = await Promise.all([
                fetch(`/api/payroll/payslips?month=${month}`),
                fetch('/api/payroll/run'),
            ]);
            const payslipData = await payslipRes.json();
            const runData = await runRes.json();

            setPayslips(payslipData.payslips ?? []);
            const found = (runData.runs ?? []).find((r: PayrollRun) => r.month === month);
            setRun(found ?? null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function updateStatus(status: string) {
        if (!run) return;
        setUpdating(true);
        setError('');
        try {
            const res = await fetch('/api/payroll/run', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ run_id: run.id, status }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setRun(data.run);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalGross = payslips.reduce((s, p) => s + p.gross_salary, 0);
    const totalDeductions = payslips.reduce((s, p) => s + p.total_deductions, 0);
    const totalNet = payslips.reduce((s, p) => s + p.net_salary, 0);

    const monthLabel = month ? format(new Date(month + '-01'), 'MMMM yyyy') : '';

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/payroll">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{monthLabel} Payroll</h1>
                        <p className="text-muted-foreground text-sm">
                            {run && `Generated ${format(new Date(run.generated_at), 'dd MMM yyyy, h:mm a')}`}
                        </p>
                    </div>
                </div>
                {run && (
                    <div className="flex items-center gap-3">
                        <StatusBadge status={run.status} />
                        {run.status === 'draft' && (
                            <Button size="sm" onClick={() => updateStatus('processed')} disabled={updating} className="gap-1.5">
                                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Mark Processed
                            </Button>
                        )}
                        {run.status === 'processed' && (
                            <Button size="sm" onClick={() => updateStatus('paid')} disabled={updating} className="gap-1.5 bg-green-600 hover:bg-green-700">
                                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Mark as Paid
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Gross', value: fmt(totalGross), color: 'blue' },
                    { label: 'Total Deductions', value: fmt(totalDeductions), color: 'red' },
                    { label: 'Total Net Payout', value: fmt(totalNet), color: 'green' },
                ].map(card => (
                    <Card key={card.label} className="border-zinc-200">
                        <CardContent className="pt-5">
                            <p className="text-2xl font-bold">{card.value}</p>
                            <p className="text-sm text-zinc-500 mt-0.5">{card.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payslip Table */}
            <Card className="border-zinc-200">
                <CardHeader>
                    <CardTitle className="text-lg">Employee Payslips — {monthLabel}</CardTitle>
                    <CardDescription>{payslips.length} employees processed</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50">
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Present / Working</TableHead>
                                <TableHead>Gross</TableHead>
                                <TableHead>Deductions</TableHead>
                                <TableHead className="font-bold">Net Salary</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payslips.map(slip => (
                                <TableRow key={slip.id}>
                                    <TableCell>
                                        <p className="font-medium text-sm">{slip.employee?.full_name}</p>
                                        <p className="text-xs text-zinc-400">{slip.employee?.emp_code}</p>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-600">{slip.employee?.department ?? '—'}</TableCell>
                                    <TableCell className="text-sm">
                                        <span className={slip.present_days < slip.working_days ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                                            {slip.present_days}
                                        </span>
                                        <span className="text-zinc-400">/{slip.working_days}</span>
                                    </TableCell>
                                    <TableCell>{fmt(slip.gross_salary)}</TableCell>
                                    <TableCell className="text-red-600">-{fmt(slip.total_deductions)}</TableCell>
                                    <TableCell className="font-bold">{fmt(slip.net_salary)}</TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/payroll/payslip/${slip.id}`}>
                                            <Button size="sm" variant="ghost" className="gap-1 text-xs h-7">
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
        </div>
    );
}
