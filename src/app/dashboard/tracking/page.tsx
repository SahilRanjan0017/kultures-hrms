'use client';

import { useHeader } from '@/lib/header-context';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
const AttendanceMap = dynamic(() => import('@/components/dashboard/AttendanceMap'), { ssr: false });
import RoleGuard from '@/components/dashboard/RoleGuard';
import { useRole } from '@/lib/role-context';
import { Map as MapIcon, Download } from 'lucide-react';

export default function TrackingPage() {
    const { setTitle, setActions } = useHeader();
    const role = useRole();

    useEffect(() => {
        setTitle("Real-time Tracking");
        setActions([
            {
                label: "Export Locations",
                icon: Download,
                onClick: () => { },
                variant: 'outline'
            }
        ]);

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions]);

    return (
        <RoleGuard role={role} permission="attendance:view">
            <div className="space-y-8 pb-20">
                <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-[0.2em]">Workforce Intelligence</h2>
                    <p className="text-zinc-500 text-sm max-w-2xl font-medium">
                        Monitor live check-ins and check-outs across your headquarters and remote sites. Points are plotted based on authenticated coordinates.
                    </p>
                </div>

                <AttendanceMap />
            </div>
        </RoleGuard>
    );
}
