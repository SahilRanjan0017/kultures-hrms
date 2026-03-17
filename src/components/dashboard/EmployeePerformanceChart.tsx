'use client';

import { MoreVertical } from "lucide-react";

export default function EmployeePerformanceChart() {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-900">Over all Employee Performance</h3>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-[11px] font-black text-zinc-900">Employee</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-[11px] font-black text-zinc-900">Intern</span>
                    </div>
                    <button className="ml-2 text-zinc-300 hover:text-zinc-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[160px] relative px-2">
                {/* Y-Axis */}
                <div className="absolute left-0 h-[80%] flex flex-col justify-between text-[10px] font-bold text-zinc-300">
                    <span>70%</span>
                    <span>40%</span>
                    <span>25%</span>
                    <span>0%</span>
                </div>

                {/* Grid Lines */}
                <div className="ml-10 h-[80%] flex flex-col justify-between">
                    <div className="w-full border-t border-dashed border-zinc-100" />
                    <div className="w-full border-t border-dashed border-zinc-100" />
                    <div className="w-full border-t border-dashed border-zinc-100" />
                </div>

                {/* SVG Area Chart Simulation */}
                <svg className="absolute left-10 right-0 top-0 h-[80%] w-[calc(100%-40px)] overflow-visible">
                    {/* Amber Area (Employee) */}
                    <path
                        d="M 0 40 L 40 45 L 80 40 L 120 55 L 160 55 L 200 45 L 240 35 L 280 45 L 320 35 L 360 25 L 400 35 L 440 25 L 440 130 L 0 130 Z"
                        fill="#FBBF24"
                        fillOpacity="1"
                    />
                    {/* Indigo Area (Intern) - Overlapped */}
                    <path
                        d="M 0 70 L 40 85 L 80 80 L 120 100 L 160 90 L 200 75 L 240 70 L 280 85 L 320 75 L 360 85 L 400 75 L 440 70 L 440 130 L 0 130 Z"
                        fill="#6366F1"
                        fillOpacity="1"
                    />
                </svg>

                {/* X-Axis */}
                <div className="absolute bottom-0 left-10 right-0 flex justify-between text-[10px] font-bold text-zinc-300">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                        <span key={m}>{m}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
