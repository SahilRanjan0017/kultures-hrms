'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Check, X, Loader2, MessageSquare, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';

interface PendingLeave {
    id: string;
    employee_name: string;
    leave_type: { name: string; color: string };
    start_date: string;
    end_date: string;
    days_count: number;
    reason: string;
    session: string;
}

export default function LeaveApprovalsPage() {
    const [pending, setPending] = useState<PendingLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const res = await fetch('/api/leaves/pending');
            const data = await res.json();
            setPending(data.requests || []);
        } catch (error) {
            console.error('Fetch pending error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        const reason = action === 'reject'
            ? prompt('Enter rejection reason:')
            : undefined;

        if (action === 'reject' && reason === null) return; // Cancelled prompt

        setActioningId(id);
        try {
            const res = await fetch(`/api/leaves/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, rejection_reason: reason }),
            });

            if (res.ok) {
                fetchPending(); // Refresh list
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to process request');
            }
        } catch (error) {
            alert('Something went wrong');
        } finally {
            setActioningId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Leave Approvals</h1>
                    <p className="text-muted-foreground">Manage pending leave requests from your team.</p>
                </div>
                <Badge variant="outline" className="h-6">
                    {pending.length} Requests Pending
                </Badge>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="history" disabled>History (Soon)</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <div className="grid grid-cols-1 gap-4">
                        {pending.map((request) => (
                            <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Left Side: Employee & Dates */}
                                        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-zinc-100">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg">{request.employee_name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ background: request.leave_type.color }}
                                                            />
                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                {request.leave_type.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-primary">
                                                        {request.days_count}
                                                        <span className="text-xs font-normal text-muted-foreground ml-1 uppercase">
                                                            days
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 uppercase tracking-tighter">
                                                        {request.session.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-zinc-600">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded border border-zinc-100">
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                    <span>{format(new Date(request.start_date), 'MMM d, yyyy')}</span>
                                                    <span className="mx-1 opacity-40">—</span>
                                                    <span>{format(new Date(request.end_date), 'MMM d, yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Reason */}
                                        <div className="flex-[1.5] p-6 bg-zinc-50/50">
                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                                                <MessageSquare className="w-3 h-3" />
                                                Reason
                                            </div>
                                            <p className="text-sm text-zinc-700 italic border-l-2 border-primary/20 pl-3 leading-relaxed">
                                                "{request.reason}"
                                            </p>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="p-6 flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-zinc-100">
                                            <Button
                                                variant="outline"
                                                className="flex-1 md:w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleAction(request.id, 'reject')}
                                                disabled={actioningId === request.id}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                className="flex-1 md:w-full bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleAction(request.id, 'approve')}
                                                disabled={actioningId === request.id}
                                            >
                                                {actioningId === request.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4 mr-2" />
                                                )}
                                                Approve
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {pending.length === 0 && (
                            <div className="text-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-700">All caught up!</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                                    There are no pending leave requests waiting for your approval.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
