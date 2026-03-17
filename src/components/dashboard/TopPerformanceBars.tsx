'use client';

import { type Employee } from "@/lib/employees";

interface TopPerformanceBarsProps {
    employees: Employee[];
}

export default function TopPerformanceBars({ employees }: TopPerformanceBarsProps) {
    // If no employees, show placeholders but label them as empty
    const displayList = employees.length > 0 ? employees : [
        { full_name: "No Data", performance: 0 },
        { full_name: "No Data", performance: 0 },
        { full_name: "No Data", performance: 0 },
    ].slice(0, 3);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-10 h-full">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Top 3 Employee by Performance</h3>

            <div className="flex-1 flex flex-col justify-between py-2">
                {displayList.map((emp: any, i) => (
                    <div key={i} className="space-y-3">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{emp.full_name}</p>
                        <div className="h-6 bg-indigo-50 rounded-lg overflow-hidden relative">
                            <div
                                className="h-full bg-indigo-600 rounded-lg transition-all duration-1000"
                                style={{ width: `${emp.performance || (20 + (i * 15))}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* X-Axis Percentage Labels */}
            <div className="flex justify-between text-[10px] font-bold text-zinc-300 px-1 border-t border-zinc-50 pt-4">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
            </div>
        </div>
    );
}
