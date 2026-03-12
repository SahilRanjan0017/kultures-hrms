'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

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

export default function LeaveTracker() {
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const res = await fetch('/api/leaves/balance');
            const data = await res.json();
            setBalances(data.balances || []);
        } catch (error) {
            console.error('Fetch balances error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-zinc-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl font-bold text-zinc-900">My Leave Tracker</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        01-Jan-{new Date().getFullYear()} to 31-Dec-{new Date().getFullYear()}
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 mb-6 gap-6 border-b border-zinc-100 w-full justify-start rounded-none">
                        <TabsTrigger
                            value="details"
                            className="data-[state=active]:bg-zinc-100 data-[state=active]:text-primary px-4 py-2 rounded-md text-sm font-medium transition-all"
                        >
                            Leave Details
                        </TabsTrigger>
                        <TabsTrigger value="special" className="text-zinc-500 px-4 py-2 hover:text-zinc-900">Special Leave</TabsTrigger>
                        <TabsTrigger value="wfh" className="text-zinc-500 px-4 py-2 hover:text-zinc-900">OPH/WFH Details</TabsTrigger>
                        <TabsTrigger value="coff" className="text-zinc-500 px-4 py-2 hover:text-zinc-900">COFF</TabsTrigger>
                    </TabsList>

                    <div className="space-y-6">
                        {balances.map((balance) => (
                            <div key={balance.id} className="flex items-center gap-6 py-1">
                                <div
                                    className="w-1 self-stretch rounded-full"
                                    style={{ backgroundColor: balance.leave_type.color }}
                                />
                                <div className="flex-1 grid grid-cols-4 items-center gap-4">
                                    {/* Type */}
                                    <div>
                                        <p className="text-sm font-medium text-zinc-500">{balance.leave_type.name}</p>
                                        <p className="text-sm font-bold tracking-tight">
                                            {balance.leave_type.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </p>
                                    </div>

                                    {/* Opening */}
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">Opening</p>
                                        <p className="text-sm font-bold text-zinc-700">{balance.total_days.toFixed(2)}</p>
                                    </div>

                                    {/* Utilized */}
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">Leave utilized</p>
                                        <p className="text-sm font-bold text-zinc-700">{balance.used_days.toFixed(2)}</p>
                                    </div>

                                    {/* Balance */}
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">Balance</p>
                                        <p className="text-sm font-bold text-zinc-700">{balance.available_days.toFixed(2)}</p>
                                    </div>
                                </div>
                                <Link href="/dashboard/leaves/apply">
                                    <span className="text-sm font-bold text-primary hover:underline cursor-pointer">Apply</span>
                                </Link>
                            </div>
                        ))}

                        {balances.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground italic text-sm">
                                No leave balances found for {new Date().getFullYear()}.
                            </div>
                        )}
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
