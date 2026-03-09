'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/lib/role-context';
import {
    Calendar,
    Clock,
    ArrowLeft,
    Search,
    FileText,
    Loader2,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Clock3
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AttendancePage() {
    const role = useRole();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

    useEffect(() => {
        fetchData();
    }, [month]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                fetch(`/api/attendance?month=${month}`),
                fetch(`/api/attendance/summary?month=${month}`)
            ]);

            const logsData = await logsRes.json();
            const statsData = await statsRes.json();

            setLogs(logsData.logs || []);
            setStats(statsData.stats);
        } catch (err) {
            console.error("Failed to fetch attendance data");
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = ['admin', 'hr'].includes(role);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard" className="p-1 hover:bg-zinc-100 rounded-md transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900">Attendance</h1>
                    </div>
                    <p className="text-zinc-500 text-sm">
                        Track and manage time logs for {month}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-40"
                    />
                    <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 uppercase">Days Present</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.totalDays || 0}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 uppercase">Total Hours</p>
                                <h3 className="text-2xl font-bold mt-1 text-zinc-900">{stats?.totalHours || 0}h</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Clock className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 uppercase">Avg Daily</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.averageHours || 0}h</h3>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Clock3 className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 uppercase">Late Days</p>
                                <h3 className="text-2xl font-bold mt-1">{stats?.lateDays || 0}</h3>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Filter className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Table */}
            <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 py-4 px-6 bg-zinc-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <CardTitle className="text-base font-semibold">Attendance Logs</CardTitle>
                        <div className="relative max-w-xs flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search employee..."
                                className="pl-9 bg-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50/50 text-zinc-500 font-medium border-b border-zinc-100">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Clock In</th>
                                    <th className="px-6 py-3">Clock Out</th>
                                    <th className="px-6 py-3 text-center">Total Hours</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Fetching logs...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                                            No logs found for this period.
                                        </td>
                                    </tr>
                                ) : logs.filter(l =>
                                    l.employees?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                    l.employees?.emp_code?.toLowerCase().includes(search.toLowerCase())
                                ).map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-zinc-900">
                                            {format(new Date(log.date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-900">{log.employees?.full_name}</span>
                                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{log.employees?.emp_code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                {format(new Date(log.clock_in), 'hh:mm a')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.clock_out ? (
                                                <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                                    {format(new Date(log.clock_out), 'hh:mm a')}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400 italic">Ongoing</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono">
                                            {log.total_hours ? `${log.total_hours}h` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Badge
                                                variant={log.status === 'present' ? 'default' : 'secondary'}
                                                className="capitalize"
                                            >
                                                {log.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

