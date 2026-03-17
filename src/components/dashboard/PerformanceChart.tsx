'use client';

import { MoreVertical, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function PerformanceChart() {
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            const res = await fetch('/api/attendance/stats/performance');
            const result = await res.json();
            if (result.ok) {
                setData(result.performance);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
        </div>
    );

    const chartData = data.length > 0 ? data : [
        { time: '9 AM', today: 0, yesterday: 0 },
        { time: '12 PM', today: 0, yesterday: 0 },
        { time: '5 PM', today: 0, yesterday: 0 },
    ];
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Employee Performance</h3>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-200" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Yesterday</span>
                    </div>
                    <button className="text-zinc-400 hover:text-zinc-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 flex flex-col min-h-[240px]">
                {/* Y-Axis Guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[100, 75, 50, 25, 0].map((val) => (
                        <div key={val} className="flex items-center gap-4 w-full">
                            <span className="text-[10px] font-bold text-zinc-300 w-8">{val}%</span>
                            <div className="flex-1 h-[1px] bg-zinc-50" />
                        </div>
                    ))}
                </div>

                {/* Bars Area */}
                <div className="flex-1 flex items-end justify-between px-10 pb-2 relative z-10">
                    {chartData.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 w-8 group">
                            <div className="relative w-full h-48 flex items-end">
                                {/* Yesterday bar */}
                                <div
                                    className="absolute bottom-0 left-0 w-full bg-indigo-50 border border-indigo-100 rounded-lg group-hover:bg-indigo-100 transition-all duration-300"
                                    style={{ height: `${item.yesterday}%` }}
                                />
                                {/* Today bar */}
                                <div
                                    className="absolute bottom-0 left-0 w-full bg-indigo-600 shadow-lg shadow-indigo-100 rounded-lg group-hover:scale-x-110 group-hover:bg-indigo-700 transition-all duration-300"
                                    style={{ height: `${item.today}%` }}
                                >
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                        {item.today}% Active
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{item.time}</span>
                        </div>
                    ))}

                    {/* Average Line */}
                    <div
                        className="absolute left-12 right-12 border-t-2 border-dashed border-zinc-900/10 z-20 pointer-events-none"
                        style={{ bottom: `${summary?.averageToday || 50}%` }}
                    >
                        <div className="absolute -left-12 -top-2.5 bg-zinc-900 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg">
                            Avg {summary?.averageToday || 0}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
