'use client';

import { MoreVertical } from "lucide-react";
import { type Employee } from "@/lib/employees";

interface EmployeeDocumentTableProps {
    employees: Employee[];
    loading: boolean;
}

export default function EmployeeDocumentTable({ employees, loading }: EmployeeDocumentTableProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-20 text-center">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Scanning Documents...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Employees Attendances</h2>
                <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
                    {["All Storage", "Full Storage", "Empty Storage"].map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab === "All Storage" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                            <th className="px-8 py-5 w-12">
                                <input type="checkbox" className="w-4 h-4 rounded-lg border-zinc-200 text-indigo-600 focus:ring-indigo-500" />
                            </th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name & Email</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Last Modified</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Storage</th>
                            <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <p className="text-sm font-bold text-zinc-400">No employees found for document tracking.</p>
                                </td>
                            </tr>
                        ) : employees.map((emp, i) => {
                            // Stable pseudo-random usage based on some property
                            const usage = Math.floor(((emp.full_name.length * 13) % 95) + 5);
                            return (
                                <tr key={emp.id} className="group hover:bg-zinc-50/30 transition-all cursor-pointer">
                                    <td className="px-8 py-6">
                                        <input type="checkbox" className="w-4 h-4 rounded-lg border-zinc-200 text-indigo-600 focus:ring-indigo-500" />
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100">
                                                {emp.profile_photo_url ? (
                                                    <img src={emp.profile_photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {emp.full_name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{emp.full_name}</p>
                                                <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <span className="text-xs font-bold text-zinc-500">
                                            {emp.updated_at ? new Date(emp.updated_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-6 w-64">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${usage}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-black text-zinc-900 w-8">{usage}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2.5 hover:bg-white rounded-xl transition-all text-zinc-300 hover:text-indigo-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
