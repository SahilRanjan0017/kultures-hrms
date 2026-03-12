'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isWeekend
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttendanceLog {
    date: string;
    clock_in: string;
    clock_out: string | null;
    total_hours: number | null;
    status: string;
}

interface LeaveRequest {
    start_date: string;
    end_date: string;
    status: string;
    leave_type: { name: string; color: string };
}

interface Props {
    logs: AttendanceLog[];
    leaves: LeaveRequest[];
    currentMonth: string; // "yyyy-MM"
    onMonthChange: (newMonth: string) => void;
}

export default function AttendanceCalendar({ logs, leaves, currentMonth, onMonthChange }: Props) {
    const monthDate = new Date(currentMonth + '-01');
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(monthDate));
        const end = endOfWeek(endOfMonth(monthDate));
        return eachDayOfInterval({ start, end });
    }, [monthDate]);

    const getDayInfo = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const log = logs.find(l => isSameDay(new Date(l.date), day));
        const leave = leaves.find(l => {
            const start = new Date(l.start_date);
            const end = new Date(l.end_date);
            return (day >= start && day <= end) && l.status === 'approved';
        });

        let status = 'Not Updated';
        if (isWeekend(day)) status = 'Weekly Off';
        if (leave) status = 'Leave';
        if (log) {
            status = log.status === 'present' ? 'Present' : log.status;
        }

        return { log, leave, status };
    };

    const legends = {
        shift: [
            { label: 'Shift', color: 'bg-emerald-500' },
            { label: 'Weekly Off', color: 'bg-blue-300' },
            { label: 'Holiday', color: 'bg-red-400' },
            { label: 'Half Day', color: 'bg-orange-300' },
        ],
        attendance: [
            { label: 'Present', color: 'bg-emerald-400' },
            { label: 'Absent', color: 'bg-red-500' },
            { label: 'Half Day Present', color: 'bg-orange-400' },
            { label: 'Leave', color: 'bg-lime-600' },
            { label: 'Not Updated', color: 'bg-zinc-200' },
        ]
    };

    return (
        <div className="space-y-4">
            {/* Legend Section */}
            <div className="flex flex-wrap items-center gap-8 py-4 px-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-zinc-600">Shift</span>
                    <div className="flex items-center gap-3">
                        {legends.shift.map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                                <span className="text-xs text-zinc-500 font-medium">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-zinc-600">Attendance</span>
                    <div className="flex items-center gap-3">
                        {legends.attendance.map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                                <span className="text-xs text-zinc-500 font-medium">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="border-zinc-200 overflow-hidden shadow-md">
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b border-zinc-100">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="py-3 text-center text-[10px] font-black tracking-widest text-red-500 bg-zinc-50 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {days.map((day, i) => {
                            const { log, leave, status } = getDayInfo(day);
                            const isCurrentMonth = isSameMonth(day, monthDate);

                            return (
                                <div
                                    key={i}
                                    className={`min-h-[140px] p-2 border-r border-b border-zinc-100 flex flex-col gap-1 transition-all hover:bg-zinc-50/50 ${!isCurrentMonth ? 'bg-zinc-50/30 opacity-40' : 'bg-white'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-zinc-400'}`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    {/* Shift Info */}
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>G (10:00-19:00)</span>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`mt-1 px-2 py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase ${status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                            status === 'Leave' ? 'bg-lime-100 text-lime-700' :
                                                status === 'Weekly Off' ? 'bg-blue-50 text-blue-500' :
                                                    'bg-zinc-100 text-zinc-600'
                                        }`}>
                                        {status}
                                    </div>

                                    {/* Punches */}
                                    {log && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span className="text-zinc-600">→ {format(new Date(log.clock_in), 'HH:mm')}</span>
                                                {log.clock_out && <span className="text-red-400">← {format(new Date(log.clock_out), 'HH:mm')}</span>}
                                            </div>
                                            {log.total_hours && (
                                                <div className="flex items-center justify-end gap-1 text-[10px] font-black text-zinc-900 mt-2 border-t border-zinc-100 pt-1">
                                                    <Clock className="w-2.5 h-2.5 opacity-40" />
                                                    {log.total_hours.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Leave Detail */}
                                    {leave && (
                                        <div className="mt-auto px-2 py-1 rounded bg-zinc-50 border border-zinc-100 italic text-[9px] text-zinc-500">
                                            {leave.leave_type.name}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
