'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Calendar as CalendarIcon, History, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface LeaveBalance {
    id: string;
    leave_type: {
        id: string;
        name: string;
        color: string;
    };
    total_days: number;
    used_days: number;
    pending_days: number;
    available_days: number;
}

interface LeaveRequest {
    id: string;
    leave_type: { name: string; color: string };
    start_date: string;
    end_date: string;
    days_count: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason: string;
    created_at: string;
}

export default function LeavesPage() {
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes] = await Promise.all([
                fetch('/api/leaves/balance'),
                fetch('/api/leaves')
            ]);

            const balanceData = await balanceRes.json();
            const historyData = await historyRes.json();

            setBalances(balanceData.balances || []);
            setRequests(historyData.requests || []);
        } catch (error) {
            console.error('Fetch leaves error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <AlertCircle className="w-4 h-4 text-zinc-400" />;
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
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
                    <p className="text-muted-foreground">Track your leave balances and request history.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/leaves/approvals">
                        <Button variant="outline">
                            View Approvals
                        </Button>
                    </Link>
                    <Link href="/dashboard/leaves/apply">
                        <Button className="shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4 mr-2" />
                            Apply for Leave
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Balances Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {balances.map((balance) => (
                    <Card key={balance.id} className="relative overflow-hidden border-none shadow-md bg-white">
                        <div
                            className="absolute top-0 left-0 w-1 h-full"
                            style={{ backgroundColor: balance.leave_type.color }}
                        />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {balance.leave_type.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <span className="text-3xl font-bold">{balance.available_days}</span>
                                <span className="text-xs text-muted-foreground">Available / {balance.total_days}</span>
                            </div>
                            <div className="mt-4 space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Used</span>
                                    <span>{balance.used_days} days</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Pending</span>
                                    <span>{balance.pending_days} days</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(balance.used_days / balance.total_days) * 100}%`,
                                            backgroundColor: balance.leave_type.color
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {balances.length === 0 && (
                    <Card className="col-span-full border-dashed border-2 bg-zinc-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-10">
                            <AlertCircle className="w-10 h-10 text-zinc-300 mb-2" />
                            <p className="text-sm text-muted-foreground">No leave balances allocated for this year.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Request History */}
            <Card className="shadow-sm border-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Request History
                        </CardTitle>
                        <CardDescription>A list of your recent leave applications.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50">
                                <TableHead>Leave Type</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applied On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: request.leave_type.color }}
                                            />
                                            <span className="font-medium text-sm">{request.leave_type.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                            <CalendarIcon className="w-3.5 h-3.5 opacity-50" />
                                            {format(new Date(request.start_date), 'MMM d')} — {format(new Date(request.end_date), 'MMM d, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-sm">
                                        {request.days_count}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(request.status)}
                                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                                                {request.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-500">
                                        {format(new Date(request.created_at), 'MMM d, h:mm a')}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic text-sm">
                                        You haven't applied for any leave yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
