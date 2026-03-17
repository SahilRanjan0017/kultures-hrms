'use client';

import { Calendar } from "lucide-react";

interface CashFlowChartProps {
    count: number;
}

export default function CashFlowChart({ count = 0 }: CashFlowChartProps) {
    // Generate pseudo-realistic cash flow based on headcount
    // Revenue = count * 50k, Expenses = count * 30k
    const revenueAmt = count * 50;
    const expenseAmt = count * 35;

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Organization Cash Flow</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-all">
                    Real-time
                    <Calendar className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex flex-col gap-2 px-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Comparison (EST.)</p>
                <div className="flex gap-6 mt-1">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-indigo-600 rounded-full" />
                        <span className="text-[11px] font-black text-zinc-900">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-1 bg-rose-500 rounded-full" />
                        <span className="text-[11px] font-black text-zinc-900">Expenses</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[160px] relative px-2">
                <div className="absolute left-0 h-full flex flex-col justify-between text-[10px] font-bold text-zinc-300 py-1">
                    <span>{(revenueAmt * 1.2).toFixed(0)}k</span>
                    <span>{(revenueAmt * 0.8).toFixed(0)}k</span>
                    <span>{(revenueAmt * 0.4).toFixed(0)}k</span>
                    <span>10k</span>
                </div>

                <div className="ml-8 h-full flex flex-col justify-between py-1">
                    <div className="w-full border-t border-dashed border-zinc-100" />
                    <div className="w-full border-t border-dashed border-zinc-100" />
                    <div className="w-full border-t border-dashed border-zinc-100" />
                    <div className="w-full border-t border-dashed border-zinc-100" />
                </div>

                <svg className="absolute left-8 right-0 top-1 h-full w-[calc(100%-32px)] overflow-visible">
                    <path
                        d="M 0 60 L 50 40 L 100 70 L 150 30 L 200 50 L 250 20 L 300 45"
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                    <path
                        d="M 0 100 L 50 110 L 100 90 L 150 105 L 200 80 L 250 95 L 300 70"
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>
            </div>

            <div className="flex justify-between ml-10 text-[10px] font-bold text-zinc-300 border-t border-zinc-50 pt-4">
                <span>Phase 1</span>
                <span>Phase 2</span>
                <span>Phase 3</span>
                <span>Current</span>
            </div>
        </div>
    );
}
