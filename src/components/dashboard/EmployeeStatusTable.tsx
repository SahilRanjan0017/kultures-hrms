'use client';

import { MoreVertical } from "lucide-react";
import { type Employee } from "@/lib/employees";

interface EmployeeStatusTableProps {
    employees: Employee[];
    loading?: boolean;
}

export default function EmployeeStatusTable({ employees, loading }: EmployeeStatusTableProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-[2rem] border border-zinc-100/50 shadow-sm p-12 text-center">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Syncing Workforce Status...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-50">
                            <th className="pl-8 py-5 w-12">
                                <div className="w-5 h-5 rounded-md border-2 border-zinc-200 cursor-pointer hover:border-indigo-600 transition-colors" />
                            </th>
                            <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name & Email</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Department</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Join Date</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-12 text-center">
                                    <p className="text-sm font-bold text-zinc-400">No active attendance records found.</p>
                                </td>
                            </tr>
                        ) : employees.map((emp) => (
                            <tr key={emp.id} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer">
                                <td className="pl-8 py-5">
                                    <div className="w-5 h-5 rounded-md border-2 border-zinc-200 group-hover:border-indigo-600 transition-colors" />
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-white shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase overflow-hidden">
                                            {emp.profile_photo_url ? (
                                                <img src={emp.profile_photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                emp.full_name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">{emp.full_name}</p>
                                            <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{emp.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className="text-xs font-semibold text-zinc-600">{emp.department || 'N/A'}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className="text-xs font-semibold text-zinc-600">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : 'N/A'}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                        emp.status === 'on leave' ? 'bg-rose-50 text-rose-600' :
                                            'bg-zinc-50 text-zinc-600'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' :
                                            emp.status === 'on leave' ? 'bg-rose-500' :
                                                'bg-zinc-400'
                                            }`} />
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-zinc-400 hover:text-indigo-600">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
