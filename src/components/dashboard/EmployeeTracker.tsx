'use client';

import { Users, TrendingUp } from "lucide-react";

interface EmployeeTrackerProps {
    total?: number;
}

export default function EmployeeTracker({ total = 0 }: EmployeeTrackerProps) {
    // Generate a pseudo-random growth chart based on total if needed, or just mock it for now but keep total dynamic
    const points = [40, 45, 42, 48, 55, 52, 60, 65, 62, total > 0 ? total : 70];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;

    // Generate SVG path for sparkline
    const width = 200;
    const height = 60;
    const step = width / (points.length - 1);

    const pathData = points.map((p, i) => {
        const x = i * step;
        const y = height - ((p - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const fillData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500 flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Workforce Growth</h2>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Growth Analytics</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl text-emerald-600 font-bold text-xs shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +100%
                </div>
            </div>

            <div className="flex items-end justify-between gap-10">
                <div className="flex flex-col gap-1">
                    <span className="text-4xl font-black text-zinc-900 tracking-tighter">{total}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Total Headcount</span>
                </div>

                <div className="flex-1 relative h-[60px] w-full max-w-[200px]">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
                        <defs>
                            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={fillData} fill="url(#sparkline-gradient)" />
                        <path d={pathData} fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={width} cy={height - ((points[points.length - 1] - min) / range) * height} r="4" fill="#4F46E5" stroke="white" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-zinc-900">{total} New</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Joined System</span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-zinc-900">0 Departed</span>
                    <span className="text-[10px] text-zinc-400 font-medium">This month</span>
                </div>
            </div>
        </div>
    );
}
