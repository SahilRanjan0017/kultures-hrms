'use client';

import { Calendar } from "lucide-react";

interface SalaryTrackerChartProps {
    payslips: any[];
}

export default function SalaryTrackerChart({ payslips = [] }: SalaryTrackerChartProps) {
    const totalAmount = payslips.reduce((acc, curr) => acc + (curr.net_salary || 0), 0);
    const fmt = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    // Pseudo distribution for visual flair
    const base = totalAmount > 0 ? totalAmount / 150 : 20;
    const data = [
        { emp: base * 1.2, free: base * 0.4 },
        { emp: base * 1.5, free: base * 0.6 },
        { emp: base * 1.8, free: base * 0.8 },
        { emp: base * 1.3, free: base * 0.5 },
        { emp: base * 1.6, free: base * 0.7 },
        { emp: base * 1.1, free: base * 0.3 },
        { emp: base * 0.9, free: base * 0.2 },
    ];

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center text-center">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Salary Tracker</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-all">
                    Active Cycle
                    <Calendar className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex-1 relative flex flex-col gap-6">
                <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-zinc-200 z-0">
                    <span className="absolute -right-6 -top-3 bg-zinc-900 text-white text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xl">
                        Avg
                    </span>
                </div>

                <div className="flex-1 flex justify-between items-end gap-2 px-2 z-10">
                    {data.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full flex flex-col-reverse gap-1 items-center">
                                <div
                                    className="w-4 bg-emerald-500 rounded-lg transition-all duration-700 hover:scale-x-110 cursor-pointer"
                                    style={{ height: `${Math.max(5, item.emp)}px` }}
                                />
                                <div
                                    className="w-4 bg-emerald-100 rounded-lg transition-all duration-700 hover:scale-x-110 cursor-pointer"
                                    style={{ height: `${Math.max(2, item.free)}px` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-300 uppercase">{days[i]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-end border-t border-zinc-50 pt-6">
                <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Payroll</p>
                    <p className="text-2xl font-black text-zinc-900 mt-1">{fmt(totalAmount)}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-zinc-900">Paid</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
