'use client';

import { useEffect } from 'react';
import { useHeader } from '@/lib/header-context';
import { UserPlus } from 'lucide-react';

export default function TeamHeaderActions({ count }: { count: number }) {
    const { setTitle, setActions } = useHeader();

    useEffect(() => {
        setTitle(`Team Members (${count})`);
        setActions([
            {
                label: "Invite Member",
                icon: UserPlus,
                onClick: () => {
                    // This could open a modal if we had one
                }
            }
        ]);

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions, count]);

    return null;
}
