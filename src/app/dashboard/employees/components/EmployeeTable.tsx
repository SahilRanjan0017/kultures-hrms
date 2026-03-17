'use client';

import { MoreVertical, Mail, Phone, MapPin, Search, Filter, Users } from "lucide-react";
import { type Employee } from "@/lib/employees";
import { Badge } from "@/components/ui/badge";

interface EmployeeTableProps {
    employees: Employee[];
    onEmployeeClick: (id: string) => void;
}

export default function EmployeeTable({
    employees,
    onEmployeeClick
}: EmployeeTableProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/50 border-b border-zinc-100">
                            <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Employee Details</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Job Title</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Department</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {employees.map((emp) => (
                            <tr
                                key={emp.id}
                                className="group hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer"
                                onClick={() => onEmployeeClick(emp.id)}
                            >
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-indigo-600 uppercase shrink-0 transition-transform group-hover:scale-105">
                                            {emp.profile_photo_url ? (
                                                <img src={emp.profile_photo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                (emp.full_name || 'U').split(' ').map(n => n[0]).join('')
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">
                                                {emp.full_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{emp.emp_code}</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                                <span className="text-[10px] font-medium text-zinc-400 truncate max-w-[150px]">{emp.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-tight italic">{emp.designation || 'Specialist'}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-900">{emp.department || 'Operations'}</span>
                                        <span className="text-[10px] text-zinc-400 font-medium mt-0.5">{emp.location || 'Remote'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${(emp.status || 'active').toLowerCase() === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                                        (emp.status || 'active').toLowerCase() === 'on leave'
                                            ? 'bg-amber-50 text-amber-600 border border-amber-100/50'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${(emp.status || 'active').toLowerCase() === 'active' ? 'bg-emerald-500' :
                                            (emp.status || 'active').toLowerCase() === 'on leave' ? 'bg-amber-500' :
                                                'bg-rose-500'
                                            }`} />
                                        {emp.status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-zinc-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100/50">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {employees.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center">
                        <Users className="w-8 h-8 text-zinc-300" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-900">No employees found</p>
                        <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters or search term</p>
                    </div>
                </div>
            )}
        </div>
    );
}

