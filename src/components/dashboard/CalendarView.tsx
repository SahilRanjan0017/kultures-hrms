'use client';

import { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Info,
    Settings,
    MoreHorizontal
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Thu', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = ['8 am', '9 am', '10 am', '11 am', '12 am'];

const EVENTS = [
    { day: 2, hour: '9 am', title: 'Conference', time: '9 am - 10 am', color: 'bg-amber-100 border-amber-200 text-amber-800' },
    { day: 3, hour: '8 am', title: 'Kate Feedback', time: '8 am - 8:30 am', color: 'bg-indigo-50 border-indigo-100 text-indigo-800' },
    { day: 3, hour: '10 am', title: 'Meet With Smith', time: '10 am - 11 am', color: 'bg-sky-50 border-sky-100 text-sky-800' },
    { day: 4, hour: '8:30 am', title: 'Update Design Systeam', time: '08:30 am - 09:30 am', color: 'bg-lime-50 border-lime-100 text-lime-800', isShifted: true },
    { day: 4, hour: '9:30 am', title: 'Upload Doc', time: '09:30 - 10 am', color: 'bg-sky-50 border-sky-100 text-sky-800', isShifted: true },
    { day: 5, hour: '11 am', title: 'Daily Sync', time: '11 am - 11:30 am', color: 'bg-purple-50 border-purple-100 text-purple-800' },
    { day: 5, hour: '11:30 am', title: 'Meet With Smith', time: '11:30 - 12 am', color: 'bg-sky-50 border-sky-100 text-sky-800' },
    { day: 6, hour: '8 am', title: 'Kate Feedback', time: '8 am - 8:30 am', color: 'bg-indigo-50 border-indigo-100 text-indigo-800' },
    { day: 6, hour: '10:30 am', title: 'Upload Doc', time: '10:30 - 11 am', color: 'bg-sky-50 border-sky-100 text-sky-800' },
    { day: 7, hour: '8 am', title: 'Daily Sync', time: '8 am - 08:30 am', color: 'bg-purple-50 border-purple-100 text-purple-800' },
    { day: 7, hour: '8:30 am', title: 'Upload Report', time: '08:30 - 9 am', color: 'bg-sky-50 border-sky-100 text-sky-800' },
    { day: 7, hour: '11 am', title: 'Update Design Systeam', time: '11 am - 12 am', color: 'bg-lime-50 border-lime-100 text-lime-800' },
];

export default function CalendarView() {
    const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Week');

    return (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col h-[800px]">
            {/* Calendar Header */}
            <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">January 2024</h2>
                    <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl">
                        <button className="px-4 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-sm rounded-lg border border-zinc-100">
                            Today
                        </button>
                        <div className="flex items-center px-1">
                            <button className="p-2 text-zinc-400 hover:text-zinc-600">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-zinc-400 hover:text-zinc-600">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 pr-4 border-r border-zinc-100 text-zinc-400">
                        <button className="p-2.5 hover:bg-zinc-50 rounded-xl transition-all">
                            <Info className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 hover:bg-zinc-50 rounded-xl transition-all">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex bg-zinc-50 p-1 rounded-xl">
                        {['Day', 'Week', 'Month'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v as any)}
                                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                                    }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[1000px] h-full flex flex-col">
                    {/* Days Header */}
                    <div className="flex border-b border-zinc-50 sticky top-0 bg-white z-10">
                        <div className="w-32 py-5 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-r border-zinc-50">
                            GMT +7
                        </div>
                        {DAYS.map((day, i) => (
                            <div key={i} className="flex-1 py-5 px-8 flex items-center justify-between border-r border-zinc-50">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{day}</span>
                                <span className="text-xl font-black text-zinc-900">{i + 8 < 10 ? `0${i + 9}` : i + 9}</span>
                            </div>
                        ))}
                    </div>

                    {/* Time Grid */}
                    <div className="flex-1 relative">
                        {HOURS.map((hour, hIndex) => (
                            <div key={hour} className="flex border-b border-zinc-50 h-32 relative">
                                <div className="w-32 py-8 px-8 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-r border-zinc-50">
                                    {hour}
                                </div>
                                {DAYS.map((_, dIndex) => {
                                    const isWeekend = dIndex === 0 || dIndex === 6;
                                    return (
                                        <div
                                            key={dIndex}
                                            className={`flex-1 border-r border-zinc-50 relative ${isWeekend ? 'bg-zinc-50/30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]' : ''
                                                }`}
                                        >
                                            {/* Render events for this day/hour */}
                                            {EVENTS.filter(e => e.day === dIndex + 1 && e.hour.startsWith(hour.split(' ')[0])).map((event, i) => (
                                                <div
                                                    key={i}
                                                    className={`absolute left-2 right-2 p-3 rounded-2xl border ${event.color} z-20 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                                                    style={{
                                                        top: event.isShifted ? '20%' : '10%',
                                                        height: '70% '
                                                    }}
                                                >
                                                    <p className="text-[11px] font-black leading-tight mb-1">{event.title}</p>
                                                    <p className="text-[9px] font-bold opacity-70 group-hover:opacity-100 transition-opacity">{event.time}</p>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
