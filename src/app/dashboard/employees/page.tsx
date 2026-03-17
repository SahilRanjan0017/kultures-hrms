'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Loader2, Calendar } from "lucide-react";
import { useHeader } from '@/lib/header-context';
import { type Employee } from '@/lib/employees';
import EmployeePerformanceChart from "@/components/dashboard/EmployeePerformanceChart";
import TopPerformanceBars from "@/components/dashboard/TopPerformanceBars";
import EmployeeListingTable from "@/components/dashboard/EmployeeListingTable";

export default function EmployeesPage() {
    const router = useRouter();
    const { setTitle, setActions } = useHeader();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [search, setSearch] = useState('');

    const fetchEmployees = useCallback(async () => {
        try {
            const query = new URLSearchParams({ search }).toString();
            const res = await fetch(`/api/employees?${query}`);
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        setTitle("Employees");
        setActions([
            {
                label: isImporting ? "Importing..." : "Import CSV",
                icon: isImporting ? Loader2 : Upload,
                onClick: () => document.getElementById('csv-upload')?.click(),
                variant: 'outline'
            },
            {
                label: "Add Employee",
                icon: Plus,
                onClick: () => router.push("/dashboard/employees/new")
            }
        ]);

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions, router, isImporting]);

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const emps = lines.slice(1).map(line => {
                const values = line.split(',');
                if (values.length < 2) return null;
                return {
                    full_name: values[0]?.trim(),
                    email: values[1]?.trim(),
                    role: values[2]?.trim() || 'employee',
                    department: values[3]?.trim(),
                    designation: values[4]?.trim()
                };
            }).filter(Boolean);

            if (emps.length === 0) {
                alert("No valid employees found in CSV");
                setIsImporting(false);
                return;
            }

            try {
                const res = await fetch('/api/employees/batch-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employees: emps })
                });
                const data = await res.json();
                if (data.ok) {
                    alert(`Import complete!`);
                    fetchEmployees();
                }
            } catch (err) {
                alert("Import failed");
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Loading Employee Records</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                disabled={isImporting}
            />

            {/* Top Performance Analytics Section */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8">
                    <EmployeePerformanceChart />
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <TopPerformanceBars employees={employees.slice(0, 3)} />
                </div>
            </div>

            {/* Main Employees List Table */}
            <div className="mt-4">
                <EmployeeListingTable
                    employees={employees}
                    onSearch={setSearch}
                />
            </div>
        </div>
    );
}
