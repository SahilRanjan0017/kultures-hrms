'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Calendar } from "lucide-react";
import PaymentStatus from "@/components/dashboard/PaymentStatus";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import SalaryTrackerChart from "@/components/dashboard/SalaryTrackerChart";
import PayrollTable from "@/components/dashboard/PayrollTable";
import { useHeader } from "@/lib/header-context";

export default function PayrollPage() {
    const { setTitle, setActions } = useHeader();
    const [loading, setLoading] = useState(true);
    const [payslips, setPayslips] = useState([]);

    useEffect(() => {
        setTitle("Payroll");
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

        fetchPayroll();

        return () => {
            setTitle("");
            setActions([]);
        };
    }, [setTitle, setActions]);

    const fetchPayroll = async () => {
        try {
            const res = await fetch('/api/payroll/payslips');
            const data = await res.json();
            setPayslips(data.payslips || []);
        } catch (error) {
            console.error("Failed to fetch payroll:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Processing Payroll Data</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Top Charts Grid */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-4">
                    <PaymentStatus payslips={payslips} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <CashFlowChart count={payslips.length} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                    <SalaryTrackerChart payslips={payslips} />
                </div>
            </div>

            {/* Main Payroll Table */}
            <div className="mt-4">
                <PayrollTable payslips={payslips} loading={loading} />
            </div>
        </div>
    );
}
