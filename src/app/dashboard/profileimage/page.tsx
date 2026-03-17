'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProfileImageRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the main profile page where the image can be managed
        router.replace('/dashboard/profile');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading Profile Settings...</p>
        </div>
    );
}
