'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addDays,
    isToday as isTodayFn
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import ApplyLeaveModal from "./ApplyLeaveModal";

export default function DashboardSideCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [holidays, setHolidays] = useState<any[]>([]);

    const fetchHolidays = async () => {
        try {
            const res = await fetch('/api/dashboard/holidays');
            const data = await res.json();
            setHolidays(data || []);
        } catch (e) {
            console.error("Failed to fetch holidays:", e);
        }
    };

    useEffect(() => {
        fetchHolidays();

        const handleRefresh = () => fetchHolidays();
        window.addEventListener('leave-applied', handleRefresh);
        return () => window.removeEventListener('leave-applied', handleRefresh);
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    return (
        <>
            <Card className="border-zinc-200 overflow-hidden shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-zinc-900">{format(currentMonth, 'MMMM')}</span>
                            <span className="text-sm font-medium text-zinc-400">{format(currentMonth, 'yyyy')}</span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={prevMonth}
                                className="p-1 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-zinc-400" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {/* Day Labels */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-[10px] font-bold text-zinc-400 text-center uppercase py-1">
                                {day[0]}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            const isToday = isTodayFn(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isHoliday = holidays.some(h => isSameDay(new Date(h.date), day));
                            const isWeeklyOff = day.getDay() === 0 || day.getDay() === 6;

                            return (
                                <div
                                    key={i}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        relative h-8 flex items-center justify-center text-xs font-semibold rounded-md cursor-pointer transition-all
                                        ${!isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600 hover:bg-zinc-50'}
                                        ${isToday ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 z-10 hover:bg-primary/90' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                    {isWeeklyOff && isCurrentMonth && !isToday && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />}
                                    {isHoliday && isCurrentMonth && !isToday && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-red-400" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-8 space-y-3 pt-6 border-t border-zinc-50">
                        <div className="grid grid-cols-2 gap-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                                <div className="w-2 h-2 rounded-full bg-red-400" /> Holiday
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                                <div className="w-2 h-2 rounded-full bg-amber-400" /> Leave
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                                <div className="w-2 h-2 rounded-full bg-blue-400" /> Awaiting
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" /> Weekly Off
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ApplyLeaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialDate={selectedDate}
            />
        </>
    );
}
