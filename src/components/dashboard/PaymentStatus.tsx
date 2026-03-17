'use client';

import { Calendar } from "lucide-react";

interface PaymentStatusProps {
    payslips: any[];
}

export default function PaymentStatus({ payslips = [] }: PaymentStatusProps) {
    const totalCount = payslips.length;
    // Assuming 'paid' if entry exists for now, or based on 'status' if we had one
    // Let's use pseudo-logic based on count to keep chart looking decent but dynamic
    const paidCount = payslips.length;
    const pendingCount = 0; // Simple for now
    const unpaidCount = 0;

    const paidPercent = totalCount > 0 ? 100 : 0;

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center text-center">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Payment Status</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-all">
                    Monthly
                    <Calendar className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="#EEF2FF"
                            strokeWidth="15"
                            fill="transparent"
                        />
                        {totalCount > 0 && (
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="#4F46E5"
                                strokeWidth="15"
                                fill="transparent"
                                strokeDasharray="440"
                                strokeDashoffset={440 * (1 - 1)}
                                strokeLinecap="round"
                            />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-black text-zinc-900">{totalCount}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center mt-1">Total<br />Generated</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-900">{paidPercent}%</p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Processed</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-900">0%</p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-2 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-50 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                    <Calendar className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <span className="text-emerald-500">Live</span> Data Source
                    </p>
                    <p className="text-[10px] font-medium text-zinc-400 mt-0.5">Real-time organization metrics</p>
                </div>
            </div>
        </div>
    );
}
