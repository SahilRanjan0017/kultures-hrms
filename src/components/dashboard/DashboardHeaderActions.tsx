'use client';

import { useEffect } from 'react';
import { useHeader } from '@/lib/header-context';
import { Plus, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardHeaderActions() {
    const { setActions } = useHeader();
    const router = useRouter();

    useEffect(() => {
        setActions([
            {
                label: "Export Data",
                icon: Download,
                onClick: () => { },
                variant: 'outline'
            },
            {
                label: "Add Employee",
                icon: Plus,
                onClick: () => router.push("/dashboard/employees/new")
            }
        ]);

        return () => setActions([]);
    }, [setActions, router]);

    return null;
}
