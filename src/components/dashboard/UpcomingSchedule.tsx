'use client';

import { Calendar, ChevronRight, Clock } from "lucide-react";

const EVENTS = [
    { id: 1, title: "Quarterly Review", date: "Oct 24", time: "10:00 AM", type: "Meeting", color: "bg-indigo-50 text-indigo-600" },
    { id: 2, title: "Diwali Holiday", date: "Oct 29", type: "Holiday", color: "bg-amber-50 text-amber-600" },
    { id: 3, title: "Team Lunch", date: "Oct 31", time: "01:30 PM", type: "Social", color: "bg-emerald-50 text-emerald-600" },
];

export default function UpcomingSchedule() {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-100/50 p-8 shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500 flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Upcoming Schedule</h2>
                <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline transition-all">View Calendar</button>
            </div>

            <div className="flex flex-col gap-4">
                {EVENTS.map((event) => (
                    <div key={event.id} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-all duration-300 border border-transparent hover:border-zinc-100/50 cursor-pointer">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${event.color} border border-white shadow-sm font-bold`}>
                            <span className="text-xs uppercase">{event.date.split(' ')[0]}</span>
                            <span className="text-base leading-none">{event.date.split(' ')[1]}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{event.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${event.color} opacity-80`}>
                                    {event.type}
                                </span>
                                {event.time && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                                        <Clock className="w-3 h-3" />
                                        {event.time}
                                    </div>
                                )}
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                ))}
            </div>
        </div>
    );
}
