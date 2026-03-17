'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    Plus,
    History,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Loader2,
    ChevronRight,
    TrendingUp
} from "lucide-react";
import { useHeader } from "@/lib/header-context";

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
    const router = useRouter();
    const { setTitle, setActions } = useHeader();
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle("Leave Management");
        setActions([
            {
                label: "Request Approvals",
                icon: History,
                onClick: () => router.push("/dashboard/leaves/approvals"),
                variant: 'outline'
            },
            {
                label: "Apply for Leave",
                icon: Plus,
                onClick: () => router.push("/dashboard/leaves/apply")
            }
        ]);
        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions, router]);

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

    return (
        <div className="space-y-10 pb-12">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {balances.map((balance) => (
                    <div key={balance.id} className="bg-white p-7 rounded-[2rem] border border-zinc-100/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 w-full h-1.5 opacity-80"
                            style={{ backgroundColor: balance.leave_type.color }}
                        />
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-50 shadow-inner group-hover:scale-110 transition-transform">
                                <CalendarIcon className="w-5 h-5 text-zinc-400" />
                            </div>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">{balance.leave_type.name}</span>
                        </div>
                        <p className="text-3xl font-black text-zinc-900 leading-none">{balance.available_days}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Available / {balance.total_days} Days</p>

                        <div className="mt-6 flex items-center justify-between gap-4">
                            <div className="flex-1 h-1.5 bg-zinc-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${(balance.used_days / balance.total_days) * 100}%`,
                                        backgroundColor: balance.leave_type.color
                                    }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap">{balance.used_days} Used</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100/50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Recent Applications</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Leave Request History</p>
                    </div>
                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Download Report</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Duration</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Days</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Applied On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {requests.map((request) => (
                                <tr key={request.id} className="group hover:bg-zinc-50/50 transition-all cursor-pointer">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                                                style={{ backgroundColor: request.leave_type.color }}
                                            />
                                            <span className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">
                                                {request.leave_type.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-900">
                                                {format(new Date(request.start_date), 'dd MMM')} — {format(new Date(request.end_date), 'dd MMM, yyyy')}
                                            </span>
                                            <span className="text-[10px] font-medium text-zinc-400 mt-0.5 line-clamp-1 italic">"{request.reason}"</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-xs font-black text-zinc-900">{request.days_count}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                            request.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                'bg-rose-50 text-rose-600'
                                            }`}>
                                            {request.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                            {request.status === 'pending' && <Clock className="w-3 h-3" />}
                                            {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-xs text-zinc-400">
                                        {format(new Date(request.created_at), 'dd MMM')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

