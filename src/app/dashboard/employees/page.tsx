// app/dashboard/employees/page.tsx
'use client';

import { useState, useEffect } from 'react';

import { EmployeeCard } from '@/app/dashboard/employees/components/EmployeeCard';
import { EmployeeFilters } from '@/app/dashboard/employees/components/EmployeeFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { type Employee } from '@/lib/employees';
import { useRole } from '@/lib/role-context';
import { Upload, Loader2 } from 'lucide-react';

export default function EmployeesPage() {
    const role = useRole();
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [filters, setFilters] = useState({
        role: 'all',
        department: 'all',
        status: 'all',
    });

    useEffect(() => {
        fetchEmployees();
    }, [filters, search]);

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',');

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
                    alert(`Import complete! ${data.results.filter((r: any) => r.success).length} success, ${data.results.filter((r: any) => !r.success).length} failed.`);
                    fetchEmployees();
                } else {
                    alert(data.message || "Import failed");
                }
            } catch (err) {
                alert("Import failed");
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
    };

    const fetchEmployees = async () => {
        try {
            const query = new URLSearchParams({
                ...filters,
                search,
            }).toString();

            const res = await fetch(`/api/employees?${query}`);
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (emp.emp_code || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <p className="text-muted-foreground">
                        Manage your team members
                    </p>
                </div>
                <div className="flex gap-2">
                    {['admin', 'hr'].includes(role) && (
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleImportCSV}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={isImporting}
                            />
                            <Button variant="outline" disabled={isImporting}>
                                {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Import CSV
                            </Button>
                        </div>
                    )}
                    <Link href="/dashboard/employees/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Employee
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or emp code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <EmployeeFilters filters={filters} onChange={setFilters} />
            </div>

            {/* Employee List */}
            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No employees found
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredEmployees.map((employee) => (
                        <EmployeeCard
                            key={employee.id}
                            employee={employee}
                            onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
