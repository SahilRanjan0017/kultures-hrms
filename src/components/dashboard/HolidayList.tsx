'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Holiday {
    name: string;
    date: string;
    type: 'regional' | 'national' | 'optional';
}

export default function HolidayList() {
    const holidays: Holiday[] = [
        { name: 'Buddha Purnima', date: '21 May, 2026', type: 'regional' },
        { name: 'Independence Day', date: '15 Aug, 2026', type: 'national' },
    ];

    return (
        <Card className="border-zinc-200 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-zinc-900 font-inter">Holiday - 2026</h3>
                </div>

                <div className="flex gap-2 mb-6 bg-zinc-50/50 p-1 rounded-lg border border-zinc-100">
                    <Badge variant="secondary" className="bg-white shadow-sm text-primary py-1.5 px-3 rounded-md cursor-pointer border-transparent">Regional</Badge>
                    <Badge variant="ghost" className="text-zinc-500 hover:text-zinc-900 cursor-pointer">National</Badge>
                    <Badge variant="ghost" className="text-zinc-500 hover:text-zinc-900 cursor-pointer">Optional</Badge>
                </div>

                <div className="space-y-4">
                    {holidays.map((h, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-1 h-12 bg-blue-400 rounded-full" />
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900">{h.name}</h4>
                                <p className="text-xs text-zinc-400 mt-0.5">{h.date} · Friday</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
