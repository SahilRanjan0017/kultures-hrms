'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { useHeader } from '@/lib/header-context';
import DocumentCategoryCard from "@/components/dashboard/DocumentCategoryCard";
import EmployeeDocumentTable from "@/components/dashboard/EmployeeDocumentTable";
import DocumentUploadSidebar from "@/components/dashboard/DocumentUploadSidebar";
import { type Employee } from '@/lib/employees';

import { useRole } from '@/lib/role-context';
import { type HeaderAction } from '@/lib/header-context';

export default function DocumentsPage() {
    const role = useRole();
    const { setTitle, setActions } = useHeader();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = role === 'admin' || role === 'hr';

    useEffect(() => {
        setTitle("Documents");

        const actions: HeaderAction[] = [
            {
                label: "Attendance Report",
                icon: Calendar,
                onClick: () => { },
                variant: 'outline'
            }
        ];

        if (isAdmin) {
            actions.push({
                label: "Bulk Upload",
                icon: Plus,
                onClick: () => { },
                variant: 'default'
            });
        }

        setActions(actions);

        fetchData();

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions, isAdmin]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch (error) {
            console.error("Failed to fetch documents data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Scanning Organizations Vault</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <div className="grid grid-cols-12 gap-8">
                {/* Left Content Area (Col 8/12) */}
                <div className={`col-span-12 ${isAdmin ? 'lg:col-span-8' : ''} space-y-8`}>
                    {/* Category Cards Grid (Admin only) */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DocumentCategoryCard
                                title="Product Design Team"
                                size={`${(employees.length * 1.5).toFixed(1)} MB`}
                                date="Updated Today"
                                color="text-amber-500"
                                bg="bg-amber-50"
                            />
                            <DocumentCategoryCard
                                title="Developer Team"
                                size={`${(employees.length * 22.4).toFixed(0)} MB`}
                                date="Updated Today"
                                color="text-emerald-500"
                                bg="bg-emerald-50"
                            />
                            <DocumentCategoryCard
                                title="Finance Team"
                                size={`${(employees.length * 0.1).toFixed(1)} GB`}
                                date="Updated Today"
                                color="text-sky-500"
                                bg="bg-sky-50"
                            />
                            <DocumentCategoryCard
                                title="Legal Archive"
                                size={`${(employees.length * 0.05).toFixed(1)} GB`}
                                date="Updated Today"
                                color="text-indigo-500"
                                bg="bg-indigo-50"
                            />
                        </div>
                    )}

                    {/* Main Table */}
                    <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">
                                {isAdmin ? "Organization Documents" : "My Personal Documents"}
                            </h2>
                        </div>
                        <EmployeeDocumentTable employees={employees} loading={loading} />
                    </div>
                </div>

                {/* Right Sidebar (Admin only) */}
                {isAdmin && (
                    <div className="col-span-12 lg:col-span-4">
                        <DocumentUploadSidebar />
                    </div>
                )}
            </div>
        </div>
    );
}
