'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceGaugeProps {
    percentage: number;
    department: string;
}

export default function AttendanceGauge({ percentage = 80, department = "Product Design" }: AttendanceGaugeProps) {
    const radius = 80;
    const strokeWidth = 14;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    // We only want a semi-circle (flat at bottom)
    // The gauge in the image looks like it covers about 240 degrees (from 4 o'clock to 8 o'clock approx)
    // Actually, it looks like a standard circular gauge, but flat.
    // Let's do a 220 degree arc.
    const arcDegree = 220;
    const arcLength = (circumference * arcDegree) / 360;
    const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Attendance Tracker</h3>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 rounded-lg text-zinc-500 text-[10px] font-bold border border-zinc-100">
                    Today
                    <ChevronLeft className="w-3 h-3 rotate-270" />
                </div>
            </div>

            <div className="relative flex items-center justify-center mb-8">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-200" // Rotate to start arc correctly
                >
                    {/* Background Arc */}
                    <circle
                        stroke="#F4F4F5"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        style={{ strokeLinecap: 'round' }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Progress Arc */}
                    <circle
                        stroke="#4F46E5"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        style={{
                            strokeDashoffset,
                            strokeLinecap: 'round',
                            transition: 'stroke-dashoffset 1s ease-in-out'
                        }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                    <span className="text-3xl font-black text-zinc-900 leading-none">{percentage}%</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Present Employees</span>
                </div>
            </div>

            <div className="w-full">
                <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest mb-3">Department of Employees</p>
                <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5 border border-zinc-100">
                    <button className="text-zinc-400 hover:text-indigo-600 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-indigo-600">{department}</span>
                    <button className="text-zinc-400 hover:text-indigo-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
