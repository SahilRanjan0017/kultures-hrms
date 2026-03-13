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

        const handleApplied = () => fetchBalances();
        window.addEventListener('leave-applied', handleApplied);
        return () => window.removeEventListener('leave-applied', handleApplied);
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
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-bold text-zinc-900 font-inter tracking-tight">My Leave Tracker</CardTitle>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">
                        01-Jan-{new Date().getFullYear()} to 31-Dec-{new Date().getFullYear()}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 mb-8 flex gap-8 border-b border-zinc-50 w-full justify-start rounded-none">
                        <TabsTrigger
                            value="details"
                            className="relative px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary text-sm font-bold text-zinc-400 transition-all hover:text-zinc-600"
                        >
                            Leave Details
                        </TabsTrigger>
                        <TabsTrigger value="special" className="px-0 py-4 text-sm font-bold text-zinc-400 hover:text-zinc-600">Special Leave</TabsTrigger>
                        <TabsTrigger value="wfh" className="px-0 py-4 text-sm font-bold text-zinc-400 hover:text-zinc-600">OPH/WFH Details</TabsTrigger>
                        <TabsTrigger value="coff" className="px-0 py-4 text-sm font-bold text-zinc-400 hover:text-zinc-600">COFF</TabsTrigger>
                    </TabsList>

                    <div className="space-y-0">
                        {balances.map((balance) => (
                            <div key={balance.id} className="group relative flex items-center gap-8 py-5 border-b border-zinc-50 hover:bg-zinc-50/30 transition-colors px-2 -mx-2 rounded-xl">
                                {/* Vertical Color Strip */}
                                <div
                                    className="w-1.5 h-10 rounded-full"
                                    style={{ backgroundColor: balance.leave_type.color }}
                                />

                                <div className="flex-1 grid grid-cols-4 items-center gap-8">
                                    {/* Type Label */}
                                    <div className="min-w-[140px]">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{balance.leave_type.name}</p>
                                        <p className="text-sm font-bold text-zinc-900 font-inter">
                                            {balance.leave_type.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Opening</p>
                                        <p className="text-sm font-bold text-zinc-700">{balance.total_days.toFixed(2)}</p>
                                    </div>

                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Leave utilized</p>
                                        <p className="text-sm font-bold text-zinc-700">{balance.used_days.toFixed(2)}</p>
                                    </div>

                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Balance</p>
                                        <p className="text-sm font-bold text-zinc-900">{balance.available_days.toFixed(2)}</p>
                                    </div>
                                </div>

                                <Link href="/dashboard/leaves/apply" className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold text-primary hover:underline underline-offset-4 decoration-primary/30 uppercase tracking-widest">
                                        Apply
                                    </span>
                                </Link>
                            </div>
                        ))}

                        {balances.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                    <Plus className="w-6 h-6 text-zinc-200" />
                                </div>
                                <p className="text-sm font-bold text-zinc-400">No leave categories active</p>
                                <p className="text-xs text-zinc-300 mt-1">Contact HR to assign leave policies.</p>
                            </div>
                        )}
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
