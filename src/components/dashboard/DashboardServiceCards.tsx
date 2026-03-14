'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, FileText, TrendingUp, ChevronRight, FileDown } from "lucide-react";
import { useState } from "react";

export default function DashboardServiceCards() {
    return (
        <div className="space-y-6">
            {/* Payslip Card */}
            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-8 flex items-center gap-8">
                    <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <Wallet className="w-10 h-10 text-zinc-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Payslip</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                            View & Download pay slips, tax slips, salary breakup and other pay-related information
                        </p>
                    </div>
                </CardContent>
            </Card>


            {/* Performance Card */}
            <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-8 flex items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Performance</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Performance management is a corporate management tool that helps managers monitor and evaluate employees' work.
                        </p>
                    </div>
                    <div className="w-32 h-32 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <TrendingUp className="w-16 h-16 text-zinc-300 group-hover:text-primary transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
