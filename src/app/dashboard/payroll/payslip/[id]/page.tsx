'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Printer, ChevronLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

interface Payslip {
    id: string;
    month: string;
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
    employee: {
        full_name: string;
        emp_code: string;
        department: string;
        designation: string;
        email: string;
    };
    payroll_run: {
        status: string;
    };
}

function fmt(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex justify-between py-2 border-b border-zinc-100 last:border-0 text-sm ${bold ? 'font-semibold' : ''}`}>
            <span className={bold ? 'text-zinc-900' : 'text-zinc-600'}>{label}</span>
            <span className={bold ? 'text-zinc-900' : 'text-zinc-800'}>{value}</span>
        </div>
    );
}

export default function PayslipDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [payslip, setPayslip] = useState<Payslip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPayslip = useCallback(async () => {
        try {
            const res = await fetch(`/api/payroll/payslips/${id}`);
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setPayslip(data.payslip);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchPayslip(); }, [fetchPayslip]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !payslip) {
        return (
            <div className="text-center py-20 text-zinc-500">
                <p className="text-lg font-medium">{error || 'Payslip not found'}</p>
                <Link href="/dashboard/payroll">
                    <Button variant="ghost" className="mt-4 gap-1.5">
                        <ChevronLeft className="w-4 h-4" /> Back to Payroll
                    </Button>
                </Link>
            </div>
        );
    }

    const monthLabel = format(new Date(payslip.month + '-01'), 'MMMM yyyy');
    const emp = payslip.employee;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Toolbar — hidden in print */}
            <div className="flex items-center justify-between print:hidden">
                <Link href="/dashboard/payroll">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <ChevronLeft className="w-4 h-4" /> Back to Payroll
                    </Button>
                </Link>
                <Button onClick={() => window.print()} className="gap-2 shadow-lg shadow-primary/20">
                    <Printer className="w-4 h-4" /> Download PDF
                </Button>
            </div>

            {/* Payslip Paper */}
            <div id="payslip-content" className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm print:shadow-none print:border-none print:rounded-none">

                {/* Company Header */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-zinc-900">Kultures HRMS</p>
                            <p className="text-xs text-zinc-500">Human Resource Management System</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-zinc-900">PAYSLIP</p>
                        <p className="text-sm text-zinc-500">{monthLabel}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${payslip.payroll_run?.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : payslip.payroll_run?.status === 'processed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-zinc-100 text-zinc-600'
                            }`}>
                            {(payslip.payroll_run?.status ?? 'draft').toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-6 mb-8 p-4 bg-zinc-50 rounded-lg">
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Employee Name</p>
                            <p className="font-semibold text-zinc-900">{emp?.full_name ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Employee Code</p>
                            <p className="font-medium text-zinc-700">{emp?.emp_code ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Email</p>
                            <p className="font-medium text-zinc-700">{emp?.email ?? '—'}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Department</p>
                            <p className="font-medium text-zinc-700">{emp?.department ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Designation</p>
                            <p className="font-medium text-zinc-700">{emp?.designation ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400 uppercase tracking-widest">Pay Period</p>
                            <p className="font-medium text-zinc-700">{monthLabel}</p>
                        </div>
                    </div>
                </div>

                {/* Attendance Summary */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">{payslip.present_days}</p>
                        <p className="text-xs text-green-600 mt-0.5">Days Present</p>
                    </div>
                    <div className="flex-1 p-3 bg-zinc-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-zinc-700">{payslip.working_days}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Working Days</p>
                    </div>
                    <div className="flex-1 p-3 bg-red-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">{payslip.working_days - payslip.present_days}</p>
                        <p className="text-xs text-red-500 mt-0.5">Absent Days</p>
                    </div>
                </div>

                {/* Earnings & Deductions Side by Side */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Earnings</p>
                        <div className="space-y-0">
                            <Row label="Basic Salary" value={fmt(payslip.basic_salary)} />
                            <Row label="HRA" value={fmt(payslip.hra)} />
                            <Row label="Transport Allowance" value={fmt(payslip.transport_allowance)} />
                            <Row label="Other Allowances" value={fmt(payslip.other_allowances)} />
                        </div>
                        <div className="mt-3 pt-3 border-t-2 border-zinc-900">
                            <Row label="Gross Salary" value={fmt(payslip.gross_salary)} bold />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Deductions</p>
                        <div className="space-y-0">
                            <Row label="Provident Fund (PF)" value={fmt(payslip.pf_deduction)} />
                            <Row label="TDS" value={fmt(payslip.tds_deduction)} />
                            <Row label="Other Deductions" value={fmt(payslip.other_deductions)} />
                        </div>
                        <div className="mt-3 pt-3 border-t-2 border-zinc-900">
                            <Row label="Total Deductions" value={fmt(payslip.total_deductions)} bold />
                        </div>
                    </div>
                </div>

                {/* Net Salary Highlight */}
                <div className="bg-zinc-900 text-white rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-zinc-400 uppercase tracking-widest font-medium">Net Salary (Take Home)</p>
                        <p className="text-3xl font-bold mt-1">{fmt(payslip.net_salary)}</p>
                    </div>
                    <div className="text-right text-sm text-zinc-400">
                        <p>Gross: {fmt(payslip.gross_salary)}</p>
                        <p>Deductions: -{fmt(payslip.total_deductions)}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-400">
                    <p>This is a computer-generated payslip and does not require a signature.</p>
                    <p>Generated by Kultures HRMS</p>
                </div>
            </div>

            {/* Print styles injected inline */}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #payslip-content, #payslip-content * { visibility: visible; }
                    #payslip-content { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}
