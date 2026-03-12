'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInCalendarDays } from 'date-fns';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Info } from 'lucide-react';
import Link from 'next/link';

interface LeaveType {
    id: string;
    leave_type: {
        id: string;
        name: string;
        color: string;
        half_day_allowed: boolean;
    };
    available_days: number;
}

export default function ApplyLeavePage() {
    const router = useRouter();
    const [leaveBalances, setLeaveBalances] = useState<LeaveType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [session, setSession] = useState('full_day');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const res = await fetch('/api/leaves/balance');
            const data = await res.json();
            setLeaveBalances(data.balances || []);
        } catch (error) {
            console.error('Fetch balances error:', error);
        } finally {
            setFetching(false);
        }
    };

    const calculateDays = () => {
        if (!dateRange.from || !dateRange.to) return 0;
        const days = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;
        if (session !== 'full_day') return days - 0.5;
        return days;
    };

    const selectedBalance = leaveBalances.find(b => b.leave_type.id === selectedTypeId);
    const daysCount = calculateDays();
    const canApply = selectedBalance && daysCount > 0 && daysCount <= selectedBalance.available_days;

    const handleSubmit = async () => {
        if (!selectedTypeId || !dateRange.from || !dateRange.to || !reason) return;

        setLoading(true);
        try {
            const res = await fetch('/api/leaves/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leave_type_id: selectedTypeId,
                    start_date: format(dateRange.from, 'yyyy-MM-dd'),
                    end_date: format(dateRange.to, 'yyyy-MM-dd'),
                    session,
                    reason,
                }),
            });

            if (res.ok) {
                router.push('/dashboard/leaves');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to apply');
            }
        } catch (error) {
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/leaves">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Apply for Leave</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Leave Type Selector */}
                    <Card className="border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                                Select Leave Type
                            </CardTitle>
                            <CardDescription>Choose the category of leave you are applying for.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {leaveBalances.map(balance => (
                                    <div
                                        key={balance.id}
                                        onClick={() => setSelectedTypeId(balance.leave_type.id)}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedTypeId === balance.leave_type.id
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full shadow-sm"
                                                    style={{ background: balance.leave_type.color }}
                                                />
                                                <span className="font-bold text-zinc-900">{balance.leave_type.name}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter bg-white">
                                                Available
                                            </Badge>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-zinc-900 tracking-tighter">{balance.available_days}</span>
                                            <span className="text-sm font-medium text-zinc-500 underline decoration-zinc-200 underline-offset-4">days remained</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Selector */}
                    <Card className="border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                                Choose Dates
                            </CardTitle>
                            <CardDescription>Select the range of days for your leave.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 flex flex-col md:flex-row gap-8">
                            <div className="border border-zinc-200 rounded-xl p-2 bg-white shadow-inner flex-shrink-0">
                                <Calendar
                                    mode="range"
                                    selected={{ from: dateRange.from, to: dateRange.to }}
                                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                    className="rounded-md"
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-wider">Preview Period</span>
                                    </div>
                                    {dateRange.from ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-zinc-900 tracking-tighter">
                                                    {format(dateRange.from, 'MMM d')}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">{format(dateRange.from, 'yyyy')}</span>
                                            </div>
                                            {dateRange.to && (
                                                <>
                                                    <div className="w-8 h-[2px] bg-zinc-300 rounded-full" />
                                                    <div className="flex flex-col">
                                                        <span className="text-2xl font-black text-zinc-900 tracking-tighter">
                                                            {format(dateRange.to, 'MMM d')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{format(dateRange.to, 'yyyy')}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center border-2 border-dashed border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-500/60 font-medium italic">Select start and end dates from calendar</p>
                                        </div>
                                    )}
                                </div>

                                {selectedBalance?.leave_type.half_day_allowed && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-zinc-700 px-1">Session Configuration</Label>
                                        <Select value={session} onValueChange={(val) => val && setSession(val)}>
                                            <SelectTrigger className="w-full h-11 rounded-xl border-zinc-200 focus:ring-primary/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="full_day">Full Day (1.0)</SelectItem>
                                                <SelectItem value="first_half">First Half (0.5)</SelectItem>
                                                <SelectItem value="second_half">Second Half (0.5)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2 px-1 text-xs text-zinc-500 font-medium">
                                            <Info className="w-3.5 h-3.5" />
                                            <span>Half-day applies across the selected duration.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reason */}
                    <Card className="border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                                Provide Reason
                            </CardTitle>
                            <CardDescription>Briefly describe the purpose of your leave.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Example: Family vacation, medical appointment, etc."
                                className="min-h-[120px] resize-none rounded-xl border-zinc-200 focus:ring-primary/20 p-4 text-zinc-900"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Request Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                                <span className="text-sm text-zinc-500">Duration</span>
                                <span className="font-bold text-lg">{daysCount} days</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                                <span className="text-sm text-zinc-500">Leave Type</span>
                                <span className="font-medium">{selectedBalance?.leave_type.name || 'None'}</span>
                            </div>

                            {!canApply && daysCount > 0 && (
                                <div className="flex gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p className="text-xs">
                                        {daysCount > (selectedBalance?.available_days || 0)
                                            ? 'Insufficient balance for this type.'
                                            : 'Please select valid dates and reason.'}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={!canApply || loading || !reason || !dateRange.from || !dateRange.to}
                                className="w-full h-12 text-lg shadow-lg shadow-primary/20"
                            >
                                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                                Submit Application
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
