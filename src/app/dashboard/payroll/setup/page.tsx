'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface EmployeeWithStructure {
    id: string;
    full_name: string;
    emp_code: string;
    department: string;
    designation: string;
    salary_structure: SalaryStructure | null;
}

interface SalaryStructure {
    id?: string;
    basic_salary: number;
    hra: number;
    transport_allowance: number;
    other_allowances: number;
    pf_deduction: number;
    tds_deduction: number;
    other_deductions: number;
}

const DEFAULT_SS: SalaryStructure = {
    basic_salary: 0, hra: 0, transport_allowance: 0, other_allowances: 0,
    pf_deduction: 0, tds_deduction: 0, other_deductions: 0,
};

function CurrencyInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="text-xs text-zinc-500 font-medium block mb-1">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
            </div>
        </div>
    );
}

export default function SalarySetupPage() {
    const [employees, setEmployees] = useState<EmployeeWithStructure[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<SalaryStructure>(DEFAULT_SS);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [roleRes, dataRes] = await Promise.all([
                fetch('/api/payroll/me'),
                fetch('/api/payroll/salary-structure/all')
            ]);

            const roleData = await roleRes.json();
            if (roleData.role !== 'admin' && roleData.role !== 'hr') {
                window.location.href = '/dashboard/payroll';
                return;
            }

            const data = await dataRes.json();
            setEmployees(data.employees ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    function startEdit(emp: EmployeeWithStructure) {
        setEditingId(emp.id);
        setForm(emp.salary_structure ?? { ...DEFAULT_SS });
        setError('');
        setSavedId(null);
    }

    function updateField(key: keyof SalaryStructure, value: number) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function handleSave(employeeId: string) {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/payroll/salary-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: employeeId, ...form }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }

            setSavedId(employeeId);
            setEditingId(null);
            await fetchData();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    const gross = (ss: SalaryStructure) =>
        ss.basic_salary + ss.hra + ss.transport_allowance + ss.other_allowances;
    const net = (ss: SalaryStructure) =>
        gross(ss) - ss.pf_deduction - ss.tds_deduction - ss.other_deductions;

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/payroll">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Salary Structure Setup</h1>
                    <p className="text-muted-foreground text-sm">Define the salary breakdown for each employee.</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            <div className="space-y-4">
                {employees.map(emp => {
                    const isEditing = editingId === emp.id;
                    const ss = isEditing ? form : (emp.salary_structure ?? DEFAULT_SS);
                    const hasStructure = !!emp.salary_structure;

                    return (
                        <Card key={emp.id} className={`border-zinc-200 transition-shadow ${isEditing ? 'shadow-md ring-2 ring-primary/20' : 'hover:shadow-sm'}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-700">
                                            {emp.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-semibold">{emp.full_name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {emp.emp_code} · {emp.department ?? '—'} · {emp.designation ?? '—'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {savedId === emp.id && !isEditing && (
                                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                                            </span>
                                        )}
                                        {!isEditing && hasStructure && (
                                            <span className="text-sm font-semibold text-zinc-700">
                                                Net {fmt(net(emp.salary_structure!))}
                                            </span>
                                        )}
                                        {!isEditing ? (
                                            <Button size="sm" variant="outline" onClick={() => startEdit(emp)}>
                                                {hasStructure ? 'Edit' : 'Set Up'}
                                            </Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                                <Button size="sm" onClick={() => handleSave(emp.id)} disabled={saving} className="gap-1.5">
                                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                    Save
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {isEditing && (
                                <CardContent className="pt-0">
                                    <div className="border-t border-zinc-100 pt-4">
                                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Earnings</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                                            <CurrencyInput label="Basic Salary" value={ss.basic_salary} onChange={v => updateField('basic_salary', v)} />
                                            <CurrencyInput label="HRA" value={ss.hra} onChange={v => updateField('hra', v)} />
                                            <CurrencyInput label="Transport Allowance" value={ss.transport_allowance} onChange={v => updateField('transport_allowance', v)} />
                                            <CurrencyInput label="Other Allowances" value={ss.other_allowances} onChange={v => updateField('other_allowances', v)} />
                                        </div>

                                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Deductions</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                                            <CurrencyInput label="PF Deduction" value={ss.pf_deduction} onChange={v => updateField('pf_deduction', v)} />
                                            <CurrencyInput label="TDS" value={ss.tds_deduction} onChange={v => updateField('tds_deduction', v)} />
                                            <CurrencyInput label="Other Deductions" value={ss.other_deductions} onChange={v => updateField('other_deductions', v)} />
                                        </div>

                                        <div className="flex gap-6 p-4 bg-zinc-50 rounded-lg text-sm">
                                            <div><span className="text-zinc-400">Gross: </span><span className="font-bold">{fmt(gross(ss))}</span></div>
                                            <div><span className="text-zinc-400">Deductions: </span><span className="font-bold text-red-600">-{fmt(ss.pf_deduction + ss.tds_deduction + ss.other_deductions)}</span></div>
                                            <div><span className="text-zinc-400">Net: </span><span className="font-bold text-green-700">{fmt(net(ss))}</span></div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}

                {employees.length === 0 && (
                    <Card className="border-dashed border-2 bg-zinc-50/50">
                        <CardContent className="py-12 text-center text-zinc-400">
                            No active employees found.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
