'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    MoreHorizontal,
    TrendingUp,
    Users,
    LayoutGrid,
    ArrowUpRight,
    Calendar,
    Plus,
    Loader2
} from 'lucide-react';
import AttendanceGauge from "@/components/dashboard/AttendanceGauge";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import EmployeeOnLeaves from "@/components/dashboard/EmployeeOnLeaves";
import EmployeeStatusTable from "@/components/dashboard/EmployeeStatusTable";
import { useHeader } from "@/lib/header-context";
import { type Employee } from '@/lib/employees';

export default function AttendancePage() {
    const { setTitle, setActions } = useHeader();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stats, setStats] = useState({ present: 0, total: 0, leaves: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle("Attendance");
        setActions([
            {
                label: "Attendance",
                icon: Calendar,
                onClick: () => { },
                variant: 'outline'
            },
            {
                label: "Add Employee",
                icon: Plus,
                onClick: () => { }
            }
        ]);

        fetchData();

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions]);

    const fetchData = async () => {
        try {
            // Fetch employees
            const empRes = await fetch('/api/employees');
            const empData = await empRes.json();
            const emps = empData.employees || [];

            // Fetch real stats
            const statsRes = await fetch('/api/attendance/stats/performance');
            const statsResult = await statsRes.json();

            const total = emps.length;
            const presentToday = statsResult.summary?.presentToday || 0;

            setEmployees(emps);
            setStats({
                total,
                present: presentToday,
                leaves: total - presentToday
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Optimizing Attendance Flow</p>
        </div>
    );

    const performancePercent = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : "0";

    return (
        <div className="space-y-10 pb-20">
            <div className="grid grid-cols-12 gap-8">
                {/* Left Side: Stats, Performance, Table */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-2 gap-8">
                        {/* Today's Attendances */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100/50 shadow-sm flex flex-col gap-6 relative overflow-hidden group hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-zinc-900">Today's Attendances</h3>
                                <button className="text-zinc-300 hover:text-zinc-600"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>
                            <div>
                                <p className="text-5xl font-black text-zinc-900 tracking-tighter">{stats.present}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Active Workforce Today</p>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                        </div>

                        {/* Today's Performance */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100/50 shadow-sm flex flex-col gap-6 relative overflow-hidden group hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-zinc-900">System Utilization</h3>
                                <button className="text-zinc-300 hover:text-zinc-600"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>
                            <div>
                                <div className="flex items-end gap-3">
                                    <p className="text-5xl font-black text-zinc-900 tracking-tighter">{performancePercent}%</p>
                                    <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full mb-1 border border-emerald-100">
                                        <ArrowUpRight className="w-3 h-3" />
                                        Optimal
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Vs. Capacity Optimization</p>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>

                    {/* Performance Chart */}
                    <div className="h-[400px]">
                        <PerformanceChart />
                    </div>

                    {/* Employee Status Table */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Employees Attendances</h2>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
                                    {["Overview", "Present", "On Leave"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab === "Overview" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:bg-zinc-50">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    Filter
                                </button>
                            </div>
                        </div>
                        <EmployeeStatusTable employees={employees} />
                    </div>
                </div>

                {/* Right Side: Gauge & Leaves */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                    <AttendanceGauge percentage={parseFloat(performancePercent)} department="Organization Wide" />
                    <EmployeeOnLeaves employees={employees.filter(e => e.status === 'on leave')} />
                </div>
            </div>
        </div>
    );
}
