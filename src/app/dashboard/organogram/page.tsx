'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, ChevronUp, ChevronDown, User } from "lucide-react";
import EmployeeJobCard from "@/components/dashboard/EmployeeJobCard";

interface Employee {
    id: string;
    full_name: string;
    emp_code: string;
    designation: string;
    location: string;
    profile_photo_url?: string;
    manager_id?: string;
    reportees_count: number;
}

export default function OrganogramPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedEmpId, setFocusedEmpId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/employees/hierarchy')
            .then(res => res.json())
            .then(data => {
                setEmployees(data);
                setLoading(false);
            });
    }, []);

    // Filtered employees for search
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return [];
        return employees.filter(emp =>
            emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [searchTerm, employees]);

    // Recursive component to render the tree
    const renderLevel = (managerId: string | null = null) => {
        const children = employees.filter(emp => emp.manager_id === managerId);
        if (children.length === 0) return null;

        return (
            <div className="flex flex-col items-center">
                <div className="flex gap-16 items-start mt-8">
                    {children.map(emp => (
                        <div key={emp.id} className="flex flex-col items-center relative">
                            {/* Vertical Line Connector Above */}
                            {managerId && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-zinc-200" />
                            )}

                            <EmployeeJobCard
                                employee={emp}
                                isFocused={focusedEmpId === emp.id}
                                onClick={() => setFocusedEmpId(emp.id)}
                            />

                            {/* Horizontal and Vertical Line Connectors Below if has children */}
                            {emp.reportees_count > 0 && (
                                <div className="flex flex-col items-center">
                                    <div className="w-px h-8 bg-zinc-200" />
                                    {renderLevel(emp.id)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 min-h-screen pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Organogram</h1>
                    <p className="text-zinc-500 mt-1">Full organization hierarchy and reporting lines</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Search For Employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 bg-white border-zinc-200 shadow-sm focus:ring-primary/20"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-md">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}

                    {/* Search Suggestions */}
                    {filteredEmployees.length > 0 && (
                        <div className="absolute mt-2 w-full bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            {filteredEmployees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFocusedEmpId(emp.id);
                                        // Scroll to employee logic could go here
                                    }}
                                    className="px-4 py-3 hover:bg-zinc-50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0">
                                        {emp.profile_photo_url ? <img src={emp.profile_photo_url} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400"><User className="w-4 h-4" /></div>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">{emp.full_name}</p>
                                        <p className="text-[10px] font-medium text-zinc-500">{emp.designation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tree Container */}
            <div className="bg-zinc-50/50 rounded-3xl border border-zinc-200/50 p-12 overflow-x-auto shadow-inner min-h-[600px] flex justify-center">
                <div className="flex flex-col items-center">
                    {/* Render top level (those with no manager or top-most active manager) */}
                    {renderLevel(null)}
                </div>
            </div>
        </div>
    );
}
