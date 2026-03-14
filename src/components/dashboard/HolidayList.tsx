'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format } from "date-fns";

interface Holiday {
    name: string;
    date: Date;
    type: 'regional' | 'national' | 'optional';
}

export default function HolidayList() {
    const [filter, setFilter] = useState<'regional' | 'national' | 'optional'>('regional');

    const allHolidays: Holiday[] = [
        { name: 'Republic Day', date: new Date('2026-01-26'), type: 'national' },
        { name: 'Maha Shivaratri', date: new Date('2026-02-15'), type: 'regional' },
        { name: 'Holi', date: new Date('2026-03-04'), type: 'national' },
        { name: 'Good Friday', date: new Date('2026-04-03'), type: 'national' },
        { name: 'Eid ul-Fitr', date: new Date('2026-03-20'), type: 'regional' },
        { name: 'Buddha Purnima', date: new Date('2026-05-21'), type: 'regional' },
        { name: 'Bakrid / Eid al-Adha', date: new Date('2026-05-27'), type: 'regional' },
        { name: 'Independence Day', date: new Date('2026-08-15'), type: 'national' },
        { name: 'Janmashtami', date: new Date('2026-09-03'), type: 'regional' },
        { name: 'Mahatma Gandhi Jayanti', date: new Date('2026-10-02'), type: 'national' },
        { name: 'Dussehra', date: new Date('2026-10-20'), type: 'national' },
        { name: 'Diwali', date: new Date('2026-11-08'), type: 'national' },
        { name: 'Guru Nanak Jayanti', date: new Date('2026-11-24'), type: 'regional' },
        { name: 'Christmas Day', date: new Date('2026-12-25'), type: 'national' },
    ];

    const filteredHolidays = allHolidays
        .filter(h => h.type === filter)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
        <Card className="border-zinc-200 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-zinc-900 font-inter tracking-tight">Holiday - 2026</h3>
                </div>

                <div className="flex gap-2 mb-6 bg-zinc-50/50 p-1 rounded-lg border border-zinc-100">
                    {(['regional', 'national', 'optional'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${filter === t
                                    ? "bg-white shadow-sm text-primary border border-zinc-100"
                                    : "text-zinc-400 hover:text-zinc-600"
                                }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
                    {filteredHolidays.length > 0 ? (
                        filteredHolidays.map((h, i) => (
                            <div key={i} className="flex gap-4 group cursor-pointer">
                                <div className={`w-1 h-12 rounded-full transition-colors ${filter === 'national' ? 'bg-orange-400' :
                                        filter === 'regional' ? 'bg-blue-400' : 'bg-zinc-300'
                                    }`} />
                                <div className="flex-1 border-b border-zinc-50 pb-4 group-last:border-0">
                                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">{h.name}</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                                        {format(h.date, 'dd MMM, yyyy')} · {format(h.date, 'EEEE')}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-zinc-400 text-xs font-medium">
                            No {filter} holidays listed for 2026.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
