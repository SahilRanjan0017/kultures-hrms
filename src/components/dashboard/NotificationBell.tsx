'use client';

import { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function fetchNotifications() {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications.slice(0, 5));
                setUnreadCount(data.notifications.filter((n: any) => !n.is_read).length);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    async function handleMarkAsRead(id: string) {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] })
            });
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 cursor-pointer">
                    <Bell className="h-5 w-5 text-zinc-600" />
                    {unreadCount > 0 && (
                        <Badge className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center p-0 bg-primary text-[10px] text-white">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-semibold">Recent Alerts</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {loading && notifications.length === 0 ? (
                        <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-500 italic">No new notifications</div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                                onClick={() => {
                                    handleMarkAsRead(n.id);
                                    if (n.link) router.push(n.link);
                                }}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-xs font-bold ${!n.is_read ? 'text-primary' : 'text-zinc-900'}`}>{n.title}</span>
                                    <span className="text-[10px] text-zinc-400">{new Date(n.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                                    {n.message}
                                </p>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <Link href="/dashboard/notifications" className="block w-full">
                    <DropdownMenuItem className="justify-center text-xs font-semibold text-primary cursor-pointer hover:bg-zinc-50 py-2">
                        View all notifications
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
