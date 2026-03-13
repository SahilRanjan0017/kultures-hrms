'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.notifications) setNotifications(data.notifications);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    async function markAsRead(ids?: string[]) {
        setMarking(true);
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (res.ok) await fetchNotifications();
        } catch (e) {
            console.error(e);
        } finally {
            setMarking(false);
        }
    }

    if (loading) {
        return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">Stay updated with leaf approvals, payroll news, and company alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead()}
                        disabled={marking}
                    >
                        {marking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <Card className="border-dashed border-zinc-200">
                        <CardContent className="py-20 flex flex-col items-center text-zinc-400">
                            <Bell className="w-10 h-10 mb-4 opacity-20" />
                            <p className="text-sm font-medium">All caught up! No notifications yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <Card key={n.id} className={`transition-all hover:bg-zinc-50/50 ${!n.is_read ? 'border-primary/20 bg-primary/5' : 'bg-white'}`}>
                            <div className="p-4 flex gap-4">
                                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-zinc-900">{n.title}</h4>
                                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{n.message}</p>
                                    <div className="pt-2 flex items-center gap-3">
                                        {n.link && (
                                            <Button variant="link" className="p-0 h-auto text-primary text-xs font-semibold" onClick={() => window.location.href = n.link!}>
                                                View Details <ExternalLink className="w-3 h-3 ml-1" />
                                            </Button>
                                        )}
                                        {!n.is_read && (
                                            <Button
                                                variant="ghost"
                                                className="p-0 h-auto text-zinc-400 hover:text-zinc-600 text-xs font-medium"
                                                onClick={() => markAsRead([n.id])}
                                            >
                                                Dismiss
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
