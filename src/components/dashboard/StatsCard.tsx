'use client';

import { Users, CalendarDays, TrendingUp, Clock, TrendingDown } from "lucide-react";

const ICON_MAP = {
    users: Users,
    calendar: CalendarDays,
    trending: TrendingUp,
    clock: Clock
};

interface StatsCardProps {
    label: string;
    value: string | number;
    iconType: keyof typeof ICON_MAP;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
    color: string;
}

export default function StatsCard({
    label,
    value,
    iconType,
    trend,
    description,
    color,
}: StatsCardProps) {
    const Icon = ICON_MAP[iconType] || Users;
    const colorMap: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 shadow-blue-100",
        green: "bg-emerald-50 text-emerald-600 shadow-emerald-100",
        yellow: "bg-amber-50 text-amber-600 shadow-amber-100",
        purple: "bg-indigo-50 text-indigo-600 shadow-indigo-100",
        rose: "bg-rose-50 text-rose-600 shadow-rose-100",
    };

    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-7 flex flex-col gap-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500 group">
            <div className="flex justify-between items-start">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorMap[color] || colorMap.blue} shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="w-7 h-7" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend.value}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-3xl font-bold text-zinc-900 tracking-tight leading-none mb-2">
                    {value}
                </p>
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                        {label}
                    </p>
                    {description && (
                        <p className="text-xs text-zinc-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
