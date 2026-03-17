'use client';

import { useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useHeader } from '@/lib/header-context';
import CalendarView from '@/components/dashboard/CalendarView';

export default function CalendarPage() {
    const { setTitle, setActions } = useHeader();

    useEffect(() => {
        setTitle("Calendar");
        setActions([
            {
                label: "Attendance",
                icon: Calendar,
                onClick: () => { },
                variant: 'outline'
            },
            {
                label: "Add Employee",
                icon: Plus,
                onClick: () => { }
            }
        ]);

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions]);

    return (
        <div className="space-y-10 pb-20">
            <CalendarView />
        </div>
    );
}
