'use client';

import { Search, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

interface PayrollTableProps {
    payslips: any[];
    loading: boolean;
}

export default function PayrollTable({ payslips, loading }: PayrollTableProps) {
    const fmt = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-20 text-center">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Fetching Payroll Records...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden mb-12">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Employees Payroll</h2>
                <div className="relative w-64 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        placeholder="Search here"
                        className="w-full bg-zinc-50/50 border border-zinc-100 rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-zinc-400 outline-none"
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
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Department</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Period</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Net Salary</th>
                            <th className="px-8 py-5 text-right"><MoreHorizontal className="w-4 h-4 text-zinc-300 ml-auto" /></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {payslips.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-8 py-20 text-center">
                                    <p className="text-sm font-bold text-zinc-400">No payroll records found for this period.</p>
                                </td>
                            </tr>
                        ) : payslips.map((slip, i) => (
                            <tr key={slip.id || i} className="group hover:bg-zinc-50/30 transition-all cursor-pointer">
                                <td className="px-8 py-6">
                                    <input type="checkbox" className="w-4 h-4 rounded-lg border-zinc-200 text-indigo-600 focus:ring-indigo-500" />
                                </td>
                                <td className="px-4 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100">
                                            {slip.employee?.profile_photo_url ? (
                                                <img src={slip.employee.profile_photo_url} alt={slip.employee.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400 bg-zinc-50">
                                                    {(slip.employee?.full_name || 'E').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">{slip.employee?.full_name || 'Unknown'}</p>
                                            <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{slip.employee?.emp_code || 'EMP-000'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-6">
                                    <span className="text-xs font-bold text-zinc-500">{slip.employee?.department || 'Staff'}</span>
                                </td>
                                <td className="px-4 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-900">{slip.month || 'Current'}</span>
                                        <span className="text-[10px] font-bold text-zinc-300 uppercase mt-0.5 tracking-tight">Monthly</span>
                                    </div>
                                </td>
                                <td className="px-4 py-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100`}>
                                        <span className={`w-1 h-1 rounded-full bg-emerald-500`} />
                                        Paid
                                    </span>
                                </td>
                                <td className="px-4 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-zinc-900">{fmt(slip.net_salary || 0)}</span>
                                        <span className="text-[10px] font-bold text-zinc-300 uppercase mt-0.5 tracking-tight">Net Amount</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2 hover:bg-white rounded-lg transition-all text-zinc-300 hover:text-zinc-600">
                                        <MoreHorizontal className="w-4 h-4" />
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
