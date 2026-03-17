'use client';

import { Search, MoreVertical } from "lucide-react";
import { type Employee } from "@/lib/employees";

interface EmployeeListingTableProps {
    employees: Employee[];
    onSearch?: (term: string) => void;
}

export default function EmployeeListingTable({ employees, onSearch }: EmployeeListingTableProps) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden mb-12">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Employees List</h2>
                <div className="relative w-72 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        placeholder="Search here"
                        onChange={(e) => onSearch?.(e.target.value)}
                        className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-zinc-400 outline-none"
                    />
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
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Role</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Department</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Emp Code</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Join Date</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {employees.map((emp) => (
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
                                <td className="px-4 py-6 text-xs font-bold text-zinc-500">{emp.designation || 'Staff'}</td>
                                <td className="px-4 py-6 text-xs font-bold text-zinc-500">{emp.department || 'N/A'}</td>
                                <td className="px-4 py-6 text-xs font-bold text-zinc-500">{emp.emp_code}</td>
                                <td className="px-4 py-6 text-xs font-bold text-zinc-500">{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : 'N/A'}</td>
                                <td className="px-4 py-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            emp.status === 'onboarding' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' :
                                                emp.status === 'onboarding' ? 'bg-amber-500' :
                                                    'bg-rose-500'
                                            }`} />
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2.5 hover:bg-white rounded-xl transition-all text-zinc-300 hover:text-indigo-600">
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
